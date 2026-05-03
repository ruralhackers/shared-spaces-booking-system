import { describe, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { lstat, mkdtemp, readFile, readlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const SCAFFOLD_SCRIPT = join(REPO_ROOT, 'scripts', 'scaffold.ts')

function runScaffold(
  projectName: string,
  target: string,
  extraArgs: string[] = []
): { status: number; output: string } {
  const args = ['run', SCAFFOLD_SCRIPT, projectName, '--target', target, ...extraArgs]
  const result = spawnSync('bun', args, { encoding: 'utf-8' })
  return { status: result.status ?? -1, output: result.stderr + result.stdout }
}

async function isSymlink(path: string): Promise<boolean> {
  try {
    const stat = await lstat(path)
    return stat.isSymbolicLink()
  } catch {
    return false
  }
}

describe('scaffold smoke test', () => {
  test('scaffolds a project with clean state, symlinks preserved, README rewritten, git initialized', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'scaffold-smoke-'))
    try {
      const projectName = 'smoke-scaffold'
      const { status, output } = runScaffold(projectName, tmp)
      expect(status, `scaffold exited non-zero:\n${output}`).toBe(0)

      const dest = join(tmp, projectName)
      expect(existsSync(dest), 'destination should exist').toBe(true)

      // Excluded directories must NOT be present.
      expect(existsSync(join(dest, 'node_modules'))).toBe(false)
      expect(existsSync(join(dest, '.turbo'))).toBe(false)
      expect(existsSync(join(dest, '.playwright-mcp'))).toBe(false)

      // Git repo initialized with one commit.
      expect(existsSync(join(dest, '.git'))).toBe(true)
      const log = spawnSync('git', ['log', '--oneline'], { cwd: dest, encoding: 'utf-8' })
      expect(log.status, `git log failed:\n${log.stderr}`).toBe(0)
      expect(log.stdout).toContain('chore: scaffold from ddd-fullstack-starter template')

      const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: dest,
        encoding: 'utf-8'
      })
      expect(branch.stdout.trim()).toBe('main')

      // README rewritten: no GitHub-template references.
      const readme = await readFile(join(dest, 'README.md'), 'utf-8')
      expect(readme).not.toContain('Use this template')
      expect(readme).not.toContain('elevenyellow/')
      expect(readme).toContain('git clone <your-repo-url>')
      expect(readme).toContain('/github subscribe <your-org>/<your-repo>')

      // Symlinks preserved (relative targets).
      expect(await isSymlink(join(dest, 'CLAUDE.md'))).toBe(true)
      expect(await readlink(join(dest, 'CLAUDE.md'))).toBe('AGENTS.md')

      expect(await isSymlink(join(dest, '.claude', 'agents'))).toBe(true)
      expect(await readlink(join(dest, '.claude', 'agents'))).toBe('../.agents/agents')

      expect(await isSymlink(join(dest, '.claude', 'skills'))).toBe(true)
      expect(await readlink(join(dest, '.claude', 'skills'))).toBe('../.agents/skills')

      expect(await isSymlink(join(dest, '.github', 'copilot-instructions.md'))).toBe(true)
      expect(await readlink(join(dest, '.github', 'copilot-instructions.md'))).toBe('../AGENTS.md')

      // Core scaffolding files copied through.
      expect(existsSync(join(dest, 'package.json'))).toBe(true)
      expect(existsSync(join(dest, 'scripts', 'init-project.ts'))).toBe(true)
      expect(existsSync(join(dest, '.agents', 'skills', 'init', 'SKILL.md'))).toBe(true)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('fails when destination already exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'scaffold-smoke-'))
    try {
      const projectName = 'smoke-existing'
      const first = runScaffold(projectName, tmp)
      expect(first.status, first.output).toBe(0)

      const second = runScaffold(projectName, tmp)
      expect(second.status).not.toBe(0)
      expect(second.output).toContain('destination already exists')
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)

  test('rejects invalid project names', () => {
    const result = runScaffold('Invalid_Name', '/tmp')
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('is invalid')
  })

  test('--no-commit initializes git but skips commit', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'scaffold-smoke-'))
    try {
      const projectName = 'smoke-no-commit'
      const { status, output } = runScaffold(projectName, tmp, ['--no-commit'])
      expect(status, output).toBe(0)

      const dest = join(tmp, projectName)
      expect(existsSync(join(dest, '.git'))).toBe(true)

      // No commits yet — `git log` should fail.
      const log = spawnSync('git', ['log', '--oneline'], { cwd: dest, encoding: 'utf-8' })
      expect(log.status).not.toBe(0)
    } finally {
      await rm(tmp, { recursive: true, force: true })
    }
  }, 120_000)
})
