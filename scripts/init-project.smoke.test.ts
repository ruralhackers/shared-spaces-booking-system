import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type Components = 'webapp' | 'none'

const REPO_ROOT = join(import.meta.dir, '..')
const INIT_SCRIPT = join(REPO_ROOT, 'scripts', 'init-project.ts')

const IGNORED_ENTRIES = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', '.next'])

async function copyTemplate(dest: string): Promise<void> {
  await cp(REPO_ROOT, dest, {
    recursive: true,
    filter: (src) => !IGNORED_ENTRIES.has(src.split('/').pop() ?? '')
  })
}

function runInit(cwd: string, components: Components): { status: number; stderr: string } {
  const args = [
    'run',
    INIT_SCRIPT,
    '-n',
    'smoke-test',
    '-i',
    '@smoke',
    '--components',
    components,
    '--skip-git-check',
    '--no-backup'
  ]
  const result = spawnSync('bun', args, { cwd, encoding: 'utf-8' })
  return { status: result.status ?? -1, stderr: result.stderr + result.stdout }
}

interface PackageJson {
  scripts?: Record<string, string>
  workspaces?: { packages?: string[] } | string[]
}

async function readPkg(dir: string): Promise<PackageJson> {
  return JSON.parse(await readFile(join(dir, 'package.json'), 'utf-8')) as PackageJson
}

function workspacePackages(pkg: PackageJson): string[] {
  if (!pkg.workspaces) return []
  if (Array.isArray(pkg.workspaces)) return pkg.workspaces
  return pkg.workspaces.packages ?? []
}

async function workspaceNames(rootDir: string, pkg: PackageJson): Promise<Set<string>> {
  const names = new Set<string>()
  for (const pattern of workspacePackages(pkg)) {
    const candidates: string[] = []
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2)
      const baseDir = join(rootDir, base)
      if (existsSync(baseDir)) {
        const { readdir } = await import('node:fs/promises')
        const entries = await readdir(baseDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) candidates.push(join(base, entry.name))
        }
      }
    } else {
      candidates.push(pattern)
    }
    for (const rel of candidates) {
      const pkgPath = join(rootDir, rel, 'package.json')
      if (existsSync(pkgPath)) {
        const subPkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as { name?: string }
        if (subPkg.name) names.add(subPkg.name)
      }
    }
  }
  return names
}

function extractWorkspaceTarget(script: string): string | null {
  const match = script.match(/bun run(?:\s+--[\w:=-]+)*\s+-F\s+(\S+)/)
  return match ? match[1] : null
}

function extractConcurrentlyScripts(script: string): string[] {
  return [...script.matchAll(/"bun run ([\w:-]+)"/g)].map((m) => m[1])
}

async function validateGeneratedProject(
  rootDir: string,
  expectedApps: Set<'api' | 'webapp'>
): Promise<void> {
  const pkg = await readPkg(rootDir)
  const scripts = pkg.scripts ?? {}
  const names = await workspaceNames(rootDir, pkg)

  for (const [name, command] of Object.entries(scripts)) {
    const target = extractWorkspaceTarget(command)
    if (target) {
      expect(
        names.has(target),
        `Script "${name}" targets missing workspace "${target}". Command: ${command}`
      ).toBe(true)
    }
    for (const ref of extractConcurrentlyScripts(command)) {
      expect(
        scripts[ref] !== undefined,
        `Script "${name}" runs "bun run ${ref}" but "${ref}" is not defined`
      ).toBe(true)
    }
  }

  for (const app of ['api', 'webapp'] as const) {
    const appDir = join(rootDir, 'apps', app)
    const shouldExist = expectedApps.has(app)
    expect(existsSync(appDir), `apps/${app} presence (expected ${shouldExist})`).toBe(shouldExist)
  }
}

describe('init-project smoke test', () => {
  const components: Array<{ label: Components; apps: Set<'api' | 'webapp'> }> = [
    { label: 'webapp', apps: new Set(['api', 'webapp']) },
    { label: 'none', apps: new Set() }
  ]

  for (const { label, apps } of components) {
    test(`--components ${label} produces a consistent project`, async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'init-smoke-'))
      try {
        const workDir = join(tmp, 'project')
        await copyTemplate(workDir)

        const { status, stderr } = runInit(workDir, label)
        expect(status, `init exited non-zero:\n${stderr}`).toBe(0)

        await validateGeneratedProject(workDir, apps)
      } finally {
        await rm(tmp, { recursive: true, force: true })
      }
    }, 120_000)
  }
})
