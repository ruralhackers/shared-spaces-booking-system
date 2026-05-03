#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import { lstat, mkdir, readdir, readFile, readlink, symlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const TEMPLATE_ROOT = resolve(import.meta.dir, '..')
const DEFAULT_TARGET = join(homedir(), 'sdk', 'projects')

const PROJECT_NAME_REGEX = /^[a-z][a-z0-9-]*$/

const EXCLUDED_NAMES = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.playwright-mcp',
  '.DS_Store'
])

interface ScaffoldOptions {
  projectName: string
  target: string
  noCommit: boolean
  dryRun: boolean
}

function printHelp(): void {
  console.log(`
Usage: new-ddd <project-name> [options]

Arguments:
  <project-name>           Project folder name (lowercase, alphanumeric with hyphens)

Options:
      --target <dir>       Parent directory (default: ~/sdk/projects)
      --no-commit          Run git init but skip the initial commit
      --dry-run            Print actions without writing anything
  -h, --help               Show this help message

Examples:
  new-ddd my-awesome-project
  new-ddd my-awesome-project --target /tmp
  new-ddd my-awesome-project --no-commit
  new-ddd my-awesome-project --dry-run
`)
}

function parseCliArgs(): ScaffoldOptions {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      target: { type: 'string' },
      'no-commit': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' }
    },
    allowPositionals: true,
    strict: true
  })

  if (values.help) {
    printHelp()
    process.exit(0)
  }

  const projectName = positionals[0]
  if (!projectName) {
    console.error('error: project name is required\n')
    printHelp()
    process.exit(1)
  }

  if (positionals.length > 1) {
    console.error(`error: unexpected extra arguments: ${positionals.slice(1).join(' ')}`)
    process.exit(1)
  }

  if (!PROJECT_NAME_REGEX.test(projectName)) {
    console.error(
      `error: project name "${projectName}" is invalid. Must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.`
    )
    process.exit(1)
  }

  const targetRaw = values.target ?? DEFAULT_TARGET
  const target = isAbsolute(targetRaw) ? targetRaw : resolve(process.cwd(), targetRaw)

  return {
    projectName,
    target,
    noCommit: values['no-commit'] ?? false,
    dryRun: values['dry-run'] ?? false
  }
}

async function copyTree(src: string, dest: string, dryRun: boolean): Promise<void> {
  if (!dryRun) {
    await mkdir(dest, { recursive: true })
  }

  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue

    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isSymbolicLink()) {
      const linkTarget = await readlink(srcPath)
      if (dryRun) {
        console.log(`  symlink ${destPath} -> ${linkTarget}`)
      } else {
        await symlink(linkTarget, destPath)
      }
    } else if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, dryRun)
    } else if (entry.isFile()) {
      if (dryRun) {
        console.log(`  copy    ${destPath}`)
      } else {
        const data = await readFile(srcPath)
        await writeFile(destPath, data)
        const stat = await lstat(srcPath)
        if (stat.mode & 0o111) {
          const { chmod } = await import('node:fs/promises')
          await chmod(destPath, stat.mode)
        }
      }
    }
  }
}

interface RewriteResult {
  applied: string[]
  missed: string[]
}

async function rewriteReadme(destRoot: string, dryRun: boolean): Promise<RewriteResult> {
  const readmePath = join(destRoot, 'README.md')
  const applied: string[] = []
  const missed: string[] = []

  if (!existsSync(readmePath)) {
    return { applied, missed: ['README.md not found'] }
  }

  const original = await readFile(readmePath, 'utf-8')
  let updated = original

  // 1) Drop the "Use this template" badge line entirely.
  const badgeRegex =
    /^\[!\[Use this template\]\([^)]*\)\]\(https:\/\/github\.com\/elevenyellow\/[^)]*\)\s*\n/m
  if (badgeRegex.test(updated)) {
    updated = updated.replace(badgeRegex, '')
    applied.push('badge')
  } else {
    missed.push('badge')
  }

  // 2) Replace the example git clone URL.
  const cloneRegex = /git clone https:\/\/github\.com\/elevenyellow\/[^\s]+\.git/g
  if (cloneRegex.test(updated)) {
    updated = updated.replace(cloneRegex, 'git clone <your-repo-url>')
    applied.push('clone-url')
  } else {
    missed.push('clone-url')
  }

  // 3) Replace the Slack /github subscribe reference.
  const slackRegex = /\/github subscribe elevenyellow\/<repo>/g
  if (slackRegex.test(updated)) {
    updated = updated.replace(slackRegex, '/github subscribe <your-org>/<your-repo>')
    applied.push('slack-subscribe')
  } else {
    missed.push('slack-subscribe')
  }

  if (updated !== original && !dryRun) {
    await writeFile(readmePath, updated, 'utf-8')
  }

  return { applied, missed }
}

async function runGit(
  cwd: string,
  args: string[],
  dryRun: boolean
): Promise<{ exitCode: number; stderr: string }> {
  if (dryRun) {
    console.log(`  git ${args.join(' ')}`)
    return { exitCode: 0, stderr: '' }
  }
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe'
  })
  const stderr = await new Response(proc.stderr).text()
  await proc.exited
  return { exitCode: proc.exitCode ?? -1, stderr }
}

async function initGitRepo(destRoot: string, noCommit: boolean, dryRun: boolean): Promise<void> {
  const init = await runGit(destRoot, ['init', '-b', 'main'], dryRun)
  if (init.exitCode !== 0) {
    throw new Error(`git init failed: ${init.stderr.trim()}`)
  }

  if (noCommit) return

  const add = await runGit(destRoot, ['add', '-A'], dryRun)
  if (add.exitCode !== 0) {
    throw new Error(`git add failed: ${add.stderr.trim()}`)
  }

  const commit = await runGit(
    destRoot,
    ['commit', '-m', 'chore: scaffold from ddd-fullstack-starter template'],
    dryRun
  )
  if (commit.exitCode !== 0) {
    throw new Error(`git commit failed: ${commit.stderr.trim()}`)
  }
}

async function main(): Promise<void> {
  const opts = parseCliArgs()

  if (!existsSync(TEMPLATE_ROOT)) {
    console.error(`error: template not found at ${TEMPLATE_ROOT}`)
    process.exit(1)
  }

  const destRoot = join(opts.target, opts.projectName)

  if (existsSync(destRoot)) {
    console.error(`error: destination already exists: ${destRoot}`)
    process.exit(1)
  }

  console.log(`📦 Scaffolding "${opts.projectName}"`)
  console.log(`   from: ${TEMPLATE_ROOT}`)
  console.log(`   to:   ${destRoot}`)
  if (opts.dryRun) console.log('   (dry-run — no changes will be written)')
  console.log()

  if (!opts.dryRun) {
    await mkdir(dirname(destRoot), { recursive: true })
  }

  console.log('→ Copying files…')
  await copyTree(TEMPLATE_ROOT, destRoot, opts.dryRun)

  console.log('→ Cleaning GitHub template references in README…')
  const rewrite = await rewriteReadme(destRoot, opts.dryRun)
  if (rewrite.applied.length > 0) {
    console.log(`   applied: ${rewrite.applied.join(', ')}`)
  }
  if (rewrite.missed.length > 0) {
    console.error(`   warning: did not match in README: ${rewrite.missed.join(', ')}`)
  }

  console.log('→ Initializing git repository…')
  await initGitRepo(destRoot, opts.noCommit, opts.dryRun)

  console.log()
  console.log(`✓ Scaffolded ${opts.projectName} at ${destRoot}`)
  console.log()
  console.log('Next steps:')
  console.log(`  cd ${destRoot}`)
  console.log('  claude    # then run /init inside Claude Code')
  console.log('  # or: bun run init')
}

main().catch((err) => {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
