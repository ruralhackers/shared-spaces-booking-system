#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

// =============================================================================
// Constants
// =============================================================================

const CURRENT_IDENTIFIER = '@dfs'
const CURRENT_NAME = 'ddd-fullstack-starter'
const CURRENT_DESCRIPTION =
  'Monorepo boilerplate following DDD principles with ports and adapters architecture'
const CURRENT_APP_SCHEME = 'dfs'

const EXTENSIONS_TO_UPDATE = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdc', '.yml', '.yaml']

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo'])

const PROJECT_NAME_REGEX = /^[a-z][a-z0-9-]*$/
const PROJECT_IDENTIFIER_REGEX = /^@[a-z][a-z0-9-]*$/

const CONCURRENCY_LIMIT = 10

// =============================================================================
// Types
// =============================================================================

type ComponentSelection = 'webapp' | 'mobile' | 'both' | 'none'

type EmailProvider = 'sendgrid' | 'resend'

type ContainerRuntime = 'docker' | 'podman' | null

interface Config {
  projectName: string
  projectIdentifier: string
  projectDescription: string
  postgresPort: number
  redisPort: number
  includeRedis: boolean
  isSaas: boolean
  emailProvider: EmailProvider
  components: ComponentSelection
  dryRun: boolean
  verbose: boolean
  skipGitCheck: boolean
  noBackup: boolean
}

interface FileChange {
  path: string
  relativePath: string
  hasIdentifier: boolean
  hasName: boolean
  hasDescription: boolean
  hasAppScheme: boolean
}

interface BackupInfo {
  dir: string
  files: Map<string, string>
}

// =============================================================================
// CLI Arguments
// =============================================================================

function parseCliArgs(): Partial<Config> {
  try {
    const { values } = parseArgs({
      options: {
        name: { type: 'string', short: 'n' },
        identifier: { type: 'string', short: 'i' },
        description: { type: 'string', short: 'd' },
        'postgres-port': { type: 'string' },
        'redis-port': { type: 'string' },
        'no-redis': { type: 'boolean' },
        saas: { type: 'boolean' },
        'no-saas': { type: 'boolean' },
        'email-provider': { type: 'string' },
        components: { type: 'string', short: 'c' },
        'dry-run': { type: 'boolean' },
        verbose: { type: 'boolean', short: 'v' },
        'skip-git-check': { type: 'boolean' },
        'no-backup': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' }
      },
      strict: true
    })

    if (values.help) {
      printHelp()
      process.exit(0)
    }

    const componentsValue = values.components as string | undefined
    let components: ComponentSelection | undefined
    if (
      componentsValue === 'webapp' ||
      componentsValue === 'mobile' ||
      componentsValue === 'both' ||
      componentsValue === 'none'
    ) {
      components = componentsValue
    } else if (componentsValue === 'webapp,mobile' || componentsValue === 'mobile,webapp') {
      components = 'both'
    }

    return {
      projectName: values.name,
      projectIdentifier: values.identifier,
      projectDescription: values.description ?? '',
      postgresPort: values['postgres-port'] ? parseInt(values['postgres-port'], 10) : undefined,
      redisPort: values['redis-port'] ? parseInt(values['redis-port'], 10) : undefined,
      includeRedis: values['no-redis'] ? false : undefined,
      isSaas: values['no-saas'] ? false : values.saas ? true : undefined,
      emailProvider:
        values['email-provider'] === 'sendgrid' || values['email-provider'] === 'resend'
          ? values['email-provider']
          : undefined,
      components,
      dryRun: values['dry-run'] ?? false,
      verbose: values.verbose ?? false,
      skipGitCheck: values['skip-git-check'] ?? false,
      noBackup: values['no-backup'] ?? false
    }
  } catch {
    return {}
  }
}

function printHelp(): void {
  console.log(`
Usage: bun run init [options]

Options:
  -n, --name <name>          Project name (lowercase, alphanumeric with hyphens)
  -i, --identifier <id>      Project identifier (e.g., @myproject)
  -d, --description <desc>   Project description
  -c, --components <list>    Components to include: both, webapp, mobile, none (default: both)
      --postgres-port <port> PostgreSQL port (default: 5432)
      --redis-port <port>    Redis port (default: 6379)
      --no-redis             Exclude Redis from the project
      --saas                 Include SaaS features (roles, admin panel) [default]
      --no-saas              Exclude SaaS features (roles, admin panel)
      --email-provider <p>   Email provider: sendgrid (default) or resend
      --dry-run              Preview changes without applying them
  -v, --verbose              Show detailed output
      --skip-git-check       Skip git status verification
      --no-backup            Skip creating backup before changes
  -h, --help                 Show this help message

Examples:
  bun run init
  bun run init --dry-run
  bun run init -n my-project -i @mp -d "My awesome project"
  bun run init -n my-project -i @mp --components webapp
  bun run init -n my-project -i @mp --components none
  bun run init -n my-project -i @mp --no-redis
  bun run init --name my-project --identifier @mp --postgres-port 5433 --redis-port 6380
  bun run init -n my-project -i @mp --email-provider resend
`)
}

// =============================================================================
// Validation
// =============================================================================

function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Project name is required' }
  }
  if (name.length < 2) {
    return { valid: false, error: 'Project name must be at least 2 characters' }
  }
  if (name.length > 50) {
    return { valid: false, error: 'Project name must be 50 characters or less' }
  }
  if (!PROJECT_NAME_REGEX.test(name)) {
    return {
      valid: false,
      error:
        'Project name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens'
    }
  }
  return { valid: true }
}

function validateProjectIdentifier(identifier: string): { valid: boolean; error?: string } {
  if (!identifier) {
    return { valid: false, error: 'Project identifier is required' }
  }
  if (!identifier.startsWith('@')) {
    return { valid: false, error: 'Project identifier must start with @' }
  }
  if (!PROJECT_IDENTIFIER_REGEX.test(identifier)) {
    return {
      valid: false,
      error:
        'Project identifier must be lowercase, start with @, followed by a letter, and contain only letters, numbers, and hyphens'
    }
  }
  return { valid: true }
}

// =============================================================================
// Container Runtime Detection
// =============================================================================

async function detectContainerRuntime(): Promise<ContainerRuntime> {
  try {
    const dockerProc = Bun.spawn(['docker', '--version'], {
      stdout: 'pipe',
      stderr: 'pipe'
    })
    await dockerProc.exited
    if (dockerProc.exitCode === 0) {
      return 'docker'
    }
  } catch {
    // Docker not available
  }

  try {
    const podmanProc = Bun.spawn(['podman', '--version'], {
      stdout: 'pipe',
      stderr: 'pipe'
    })
    await podmanProc.exited
    if (podmanProc.exitCode === 0) {
      return 'podman'
    }
  } catch {
    // Podman not available
  }

  return null
}

// =============================================================================
// Root Directory Resolution
// =============================================================================

function looksLikeTemplateRoot(dir: string): boolean {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return false
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name?: string }
    return pkg.name === CURRENT_NAME
  } catch {
    return false
  }
}

function resolveRootDir(): string {
  const cwd = process.cwd()
  if (looksLikeTemplateRoot(cwd)) return cwd
  return join(import.meta.dir, '..')
}

// =============================================================================
// Git Operations
// =============================================================================

async function checkGitStatus(rootDir: string): Promise<{ clean: boolean; message?: string }> {
  try {
    const gitDir = join(rootDir, '.git')
    if (!existsSync(gitDir)) {
      return { clean: true, message: 'Not a git repository' }
    }

    const proc = Bun.spawn(['git', 'status', '--porcelain'], {
      cwd: rootDir,
      stdout: 'pipe',
      stderr: 'pipe'
    })

    const output = await new Response(proc.stdout).text()
    await proc.exited

    if (output.trim()) {
      const changedFiles = output.trim().split('\n').length
      return {
        clean: false,
        message: `You have ${changedFiles} uncommitted change(s). Consider committing or stashing before proceeding.`
      }
    }

    return { clean: true }
  } catch {
    return { clean: true, message: 'Could not check git status' }
  }
}

// =============================================================================
// File Operations
// =============================================================================

async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = []

  async function scan(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)

        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
            await scan(fullPath)
          }
        } else if (entry.isFile()) {
          const hasValidExtension = extensions.some((ext) => entry.name.endsWith(ext))
          if (hasValidExtension) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`  Warning: Could not scan ${currentDir}:`, error)
    }
  }

  await scan(dir)
  return files
}

async function analyzeFile(filePath: string, rootDir: string): Promise<FileChange | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const relativePath = filePath.replace(`${rootDir}/`, '')

    const hasIdentifier = content.includes(CURRENT_IDENTIFIER)
    const hasName = content.includes(CURRENT_NAME)
    const hasDescription = content.includes(CURRENT_DESCRIPTION)
    const hasAppScheme = content.includes(CURRENT_APP_SCHEME)

    if (hasIdentifier || hasName || hasDescription || hasAppScheme) {
      return {
        path: filePath,
        relativePath,
        hasIdentifier,
        hasName,
        hasDescription,
        hasAppScheme
      }
    }
    return null
  } catch {
    return null
  }
}

async function analyzeFiles(
  files: string[],
  rootDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<FileChange[]> {
  const changes: FileChange[] = []
  let processed = 0

  // Process in batches for concurrency control
  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const batch = files.slice(i, i + CONCURRENCY_LIMIT)
    const results = await Promise.all(batch.map((file) => analyzeFile(file, rootDir)))

    for (const result of results) {
      if (result) changes.push(result)
    }

    processed += batch.length
    onProgress?.(processed, files.length)
  }

  return changes
}

// =============================================================================
// Backup Operations
// =============================================================================

async function createBackup(files: FileChange[], rootDir: string): Promise<BackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = join(rootDir, '.init-backup', timestamp)
  await mkdir(backupDir, { recursive: true })

  const backupFiles = new Map<string, string>()

  for (const file of files) {
    try {
      const content = await readFile(file.path, 'utf-8')
      backupFiles.set(file.path, content)

      // Also save to disk for safety
      const backupPath = join(backupDir, file.relativePath)
      await mkdir(join(backupPath, '..'), { recursive: true })
      await writeFile(backupPath, content, 'utf-8')
    } catch {
      // Skip files that can't be read
    }
  }

  return { dir: backupDir, files: backupFiles }
}

async function restoreBackup(backup: BackupInfo): Promise<void> {
  console.log('\n  Restoring from backup...')

  for (const [filePath, content] of backup.files) {
    try {
      await writeFile(filePath, content, 'utf-8')
    } catch (error) {
      console.error(`  Failed to restore ${filePath}:`, error)
    }
  }

  console.log('  Backup restored successfully')
}

async function cleanupBackup(backupDir: string): Promise<void> {
  try {
    await rm(backupDir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
}

// =============================================================================
// Replace Operations
// =============================================================================

async function replaceInFile(
  filePath: string,
  replacements: Array<{ old: string; new: string }>,
  dryRun: boolean
): Promise<{ updated: boolean; changes: string[] }> {
  try {
    let content = await readFile(filePath, 'utf-8')
    const changes: string[] = []
    let updated = false

    for (const { old: oldValue, new: newValue } of replacements) {
      if (content.includes(oldValue)) {
        if (!dryRun) {
          content = content.replaceAll(oldValue, newValue)
        }
        changes.push(`${oldValue} → ${newValue}`)
        updated = true
      }
    }

    if (updated && !dryRun) {
      await writeFile(filePath, content, 'utf-8')
    }

    return { updated, changes }
  } catch (error) {
    throw new Error(`Failed to process ${filePath}: ${error}`)
  }
}

async function applyChanges(
  files: FileChange[],
  config: Config,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<{ successful: number; failed: string[] }> {
  const replacements: Array<{ old: string; new: string }> = [
    { old: CURRENT_IDENTIFIER, new: config.projectIdentifier },
    { old: CURRENT_NAME, new: config.projectName },
    { old: CURRENT_APP_SCHEME, new: config.projectName }
  ]

  if (config.projectDescription) {
    replacements.push({ old: CURRENT_DESCRIPTION, new: config.projectDescription })
  }

  let successful = 0
  const failed: string[] = []

  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const batch = files.slice(i, i + CONCURRENCY_LIMIT)

    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const result = await replaceInFile(file.path, replacements, config.dryRun)
        return { file, result }
      })
    )

    for (const [j, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        successful++
        if (config.verbose && result.value.result.updated) {
          console.log(`  ${config.dryRun ? '[DRY-RUN]' : '✓'} ${result.value.file.relativePath}`)
        }
      } else {
        const failedFile = batch[j]
        if (failedFile) {
          failed.push(failedFile.relativePath)
        }
      }
    }

    onProgress?.(
      Math.min(i + CONCURRENCY_LIMIT, files.length),
      files.length,
      batch[0]?.relativePath ?? ''
    )
  }

  return { successful, failed }
}

// =============================================================================
// Environment Setup
// =============================================================================

async function setupEnvFile(rootDir: string, config: Config): Promise<boolean> {
  const envLocalPath = join(rootDir, '.env.local')
  const envExamplePath = join(rootDir, '.env.example')
  const envLocalExists = existsSync(envLocalPath)

  if (!envLocalExists && !existsSync(envExamplePath)) {
    if (config.verbose) {
      console.log('  .env.example not found, skipping .env.local creation')
    }
    return false
  }

  if (config.dryRun) {
    console.log(`  [DRY-RUN] Would ${envLocalExists ? 'update' : 'create'} .env.local`)
    return true
  }

  if (!envLocalExists) {
    await copyFile(envExamplePath, envLocalPath)
  }

  let envContent = await readFile(envLocalPath, 'utf-8')

  // Update PostgreSQL config
  envContent = envContent
    .replace(
      /DATABASE_URL=postgresql:\/\/.*@localhost:\d+\/.*/,
      `DATABASE_URL=postgresql://${config.projectName}-user:${config.projectName}-password@localhost:${config.postgresPort}/${config.projectName}-local`
    )
    .replace(/POSTGRES_PORT=.*/, `POSTGRES_PORT=${config.postgresPort}`)
    .replace(/EMAIL_FROM=.*/, `EMAIL_FROM=hello@${config.projectName}.com`)

  // Update email provider config
  if (config.emailProvider === 'resend') {
    envContent = envContent
      .replace(/# sendgrid\n/, '')
      .replace(/EMAIL_SERVER=.*\n/, '')
      .replace(/# resend\n# /, '')
  } else {
    envContent = envContent.replace(/# sendgrid\n/, '').replace(/# resend\n# .*\n/, '')
  }

  // Update or remove Redis config
  if (config.includeRedis) {
    envContent = envContent
      .replace(/REDIS_URL=.*/, `REDIS_URL="redis://localhost:${config.redisPort}"`)
      .replace(/REDIS_PORT=.*/, `REDIS_PORT=${config.redisPort}`)
  } else {
    envContent = envContent.replace(/REDIS_URL=.*\n?/, '').replace(/REDIS_PORT=.*\n?/, '')
  }

  await writeFile(envLocalPath, envContent, 'utf-8')
  console.log(`  ✓ ${envLocalExists ? 'Updated' : 'Created'} .env.local`)

  // Update docker-compose.yml port defaults when non-standard ports are chosen
  const dockerComposePath = join(rootDir, 'docker-compose.yml')
  if (existsSync(dockerComposePath)) {
    let composeContent = await readFile(dockerComposePath, 'utf-8')
    const originalCompose = composeContent

    if (config.postgresPort !== 5432) {
      composeContent = composeContent.replace(
        /\$\{POSTGRES_PORT:-\d+\}:\d+/,
        `\${POSTGRES_PORT:-${config.postgresPort}}:5432`
      )
    }

    if (config.includeRedis && config.redisPort !== 6379) {
      composeContent = composeContent.replace(
        /\$\{REDIS_PORT:-\d+\}:\d+/,
        `\${REDIS_PORT:-${config.redisPort}}:6379`
      )
    }

    if (composeContent !== originalCompose) {
      await writeFile(dockerComposePath, composeContent, 'utf-8')
      console.log('  ✓ Updated docker-compose.yml port defaults')
    }
  }

  return true
}

// =============================================================================
// Container Runtime Setup
// =============================================================================

async function updateContainerRuntime(
  rootDir: string,
  runtime: ContainerRuntime,
  dryRun: boolean
): Promise<void> {
  if (!runtime) {
    console.log('  ⚠️  No container runtime (Docker/Podman) detected')
    return
  }

  const packageJsonPath = join(rootDir, 'package.json')
  if (!existsSync(packageJsonPath)) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.scripts?.dbs) return

  const currentScript = packageJson.scripts.dbs as string
  let newScript: string

  if (runtime === 'podman') {
    newScript = currentScript.replace('docker-compose', 'podman compose')
  } else {
    newScript = currentScript.replace('podman compose', 'docker-compose')
  }

  if (currentScript !== newScript) {
    if (dryRun) {
      console.log(`  [DRY-RUN] Would update dbs script to use ${runtime}`)
    } else {
      packageJson.scripts.dbs = newScript
      await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
      console.log(`  ✓ Updated dbs script to use ${runtime}`)
    }
  }
}

// =============================================================================
// Redis Removal
// =============================================================================

async function removeRedisFromProject(rootDir: string, dryRun: boolean): Promise<void> {
  const dockerComposePath = join(rootDir, 'docker-compose.yml')

  if (!existsSync(dockerComposePath)) return

  const content = await readFile(dockerComposePath, 'utf-8')

  // Remove redis volume definition
  let newContent = content.replace(/\n\s+[\w-]+-redis:$/m, '')

  // Remove redis service block (match "  redis:" and all following lines indented at 4+ spaces)
  newContent = newContent.replace(/\n {2}redis:\n(?:^(?: {4}.*| *)$\n?)*/m, '\n')

  if (content !== newContent) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove Redis from docker-compose.yml')
    } else {
      await writeFile(dockerComposePath, newContent, 'utf-8')
      console.log('  ✓ Removed Redis from docker-compose.yml')
    }
  }
}

// =============================================================================
// SaaS Features Removal
// =============================================================================

function removeSaasMarkers(content: string): string {
  // Remove lines with single-line "// saas" marker comments
  let result = content.replace(/^.*\/\/\s*saas\s*$/gm, '')

  // Remove blocks between // saas:start and // saas:end (including the markers)
  result = result.replace(/^[ \t]*\/\/\s*saas:start\s*\n[\s\S]*?^[ \t]*\/\/\s*saas:end\s*\n?/gm, '')

  // Remove lines with Prisma single-line "// saas" comments
  result = result.replace(/^.*\/\/\s*saas\s*$/gm, '')

  // Clean up excessive blank lines left behind (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

async function removeSaasFeatures(rootDir: string, dryRun: boolean): Promise<void> {
  // 1. Remove directories
  // Note: after the Vite migration there is no `app/(main)/admin` route yet.
  // This list is preserved as a placeholder for the future admin route under `apps/webapp/src/routes/admin/`.
  const dirsToRemove: string[] = []

  for (const dir of dirsToRemove) {
    const fullPath = join(rootDir, dir)
    if (existsSync(fullPath)) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would remove ${dir}/`)
      } else {
        await rm(fullPath, { recursive: true, force: true })
        console.log(`  ✓ Removed ${dir}/`)
      }
    }
  }

  // 2. Remove individual files
  const filesToRemove = ['packages/users/domain/value-objects/user-role.vo.ts']

  for (const file of filesToRemove) {
    const fullPath = join(rootDir, file)
    if (existsSync(fullPath)) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would remove ${file}`)
      } else {
        await rm(fullPath, { force: true })
        console.log(`  ✓ Removed ${file}`)
      }
    }
  }

  // 3. Remove saas-marked code from files
  const filesToEdit = [
    'packages/database/prisma/schema.prisma',
    'packages/users/domain/entities/user.entity.ts',
    'packages/users/domain/entities/user.dto.ts',
    'packages/users/domain/index.ts',
    'packages/auth/src/types.ts',
    'packages/auth/src/config.ts',
    'packages/api/src/core/context.ts',
    'packages/api/src/core/procedures.ts',
    'packages/database/src/seed.ts'
    // webapp-side SaaS wiring will be re-added when the sidebar / admin / user-store features
    // are ported into `apps/webapp/src/routes/` (see apps/webapp/MIGRATION.md).
  ]

  for (const file of filesToEdit) {
    const fullPath = join(rootDir, file)
    if (!existsSync(fullPath)) continue

    const content = await readFile(fullPath, 'utf-8')
    const cleaned = removeSaasMarkers(content)

    if (content !== cleaned) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would strip SaaS markers from ${file}`)
      } else {
        await writeFile(fullPath, cleaned, 'utf-8')
        console.log(`  ✓ Stripped SaaS code from ${file}`)
      }
    }
  }

  // 4. Remove empty value-objects directory if it exists
  const voDir = join(rootDir, 'packages/users/domain/value-objects')
  if (existsSync(voDir)) {
    try {
      const entries = await readdir(voDir)
      if (entries.length === 0) {
        if (!dryRun) {
          await rm(voDir, { recursive: true, force: true })
        }
      }
    } catch {
      // Ignore
    }
  }
}

// =============================================================================
// Email Provider Selection
// =============================================================================

function removeEmailProviderMarkers(content: string, provider: EmailProvider): string {
  const keep = provider
  const remove = provider === 'sendgrid' ? 'resend' : 'sendgrid'

  // Remove blocks between // <remove>:start and // <remove>:end (including the markers and content)
  const removeBlockRegex = new RegExp(
    `^[ \\t]*\\/\\/\\s*${remove}:start[ \\t]*\\n[\\s\\S]*?^[ \\t]*\\/\\/\\s*${remove}:end[ \\t]*\\n?`,
    'gm'
  )
  let result = content.replace(removeBlockRegex, '')

  // Uncomment blocks between // <keep>:start and // <keep>:end
  const keepBlockRegex = new RegExp(
    `^[ \\t]*\\/\\/\\s*${keep}:start[ \\t]*\\n([\\s\\S]*?)^[ \\t]*\\/\\/\\s*${keep}:end[ \\t]*\\n?`,
    'gm'
  )
  result = result.replace(keepBlockRegex, (_match, block) => {
    // If the block content is commented (starts with //), uncomment it
    const lines = (block as string).split('\n')
    const hasCommentedCode = lines.some((line: string) => /^\s*\/\/ /.test(line))

    if (hasCommentedCode) {
      return lines.map((line: string) => line.replace(/^(\s*)\/\/ ?/, '$1')).join('\n')
    }
    // Block is already uncommented, just return it without markers
    return block as string
  })

  // Clean up excessive blank lines left behind (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

async function removeUnusedEmailProvider(
  rootDir: string,
  provider: EmailProvider,
  dryRun: boolean
): Promise<void> {
  // 1. Strip email provider markers from source files
  const filesToEdit = ['apps/api/src/auth.ts']

  for (const file of filesToEdit) {
    const fullPath = join(rootDir, file)
    if (!existsSync(fullPath)) continue

    const content = await readFile(fullPath, 'utf-8')
    const cleaned = removeEmailProviderMarkers(content, provider)

    if (content !== cleaned) {
      if (dryRun) {
        console.log(
          `  [DRY-RUN] Would configure ${provider === 'resend' ? 'Resend' : 'SendGrid'} in ${file}`
        )
      } else {
        await writeFile(fullPath, cleaned, 'utf-8')
        console.log(`  ✓ Configured ${provider === 'resend' ? 'Resend' : 'SendGrid'} in ${file}`)
      }
    }
  }

  // 2. Update apps/api package.json dependencies (email provider now lives in the backend)
  const apiPkgPath = join(rootDir, 'apps/api/package.json')
  if (existsSync(apiPkgPath)) {
    const packageJson = JSON.parse(await readFile(apiPkgPath, 'utf-8'))

    if (provider === 'resend') {
      // Remove nodemailer, keep resend
      delete packageJson.dependencies?.nodemailer
      delete packageJson.devDependencies?.['@types/nodemailer']
    } else {
      // Remove resend, keep nodemailer
      delete packageJson.dependencies?.resend
    }

    if (dryRun) {
      console.log(
        `  [DRY-RUN] Would update dependencies for ${provider === 'resend' ? 'Resend' : 'SendGrid'}`
      )
    } else {
      await writeFile(apiPkgPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
      console.log(`  ✓ Updated dependencies for ${provider === 'resend' ? 'Resend' : 'SendGrid'}`)
    }
  }

  // 3. Update .env.example email config
  const envExamplePath = join(rootDir, '.env.example')
  if (existsSync(envExamplePath)) {
    let envContent = await readFile(envExamplePath, 'utf-8')

    if (provider === 'resend') {
      // Remove sendgrid line and comment, uncomment resend
      envContent = envContent
        .replace(/# sendgrid\n/, '')
        .replace(/EMAIL_SERVER=.*\n/, '')
        .replace(/# resend\n# /, '')
    } else {
      // Remove resend comment and line
      envContent = envContent.replace(/# sendgrid\n/, '').replace(/# resend\n# .*\n/, '')
    }

    if (dryRun) {
      console.log('  [DRY-RUN] Would update .env.example for email provider')
    } else {
      await writeFile(envExamplePath, envContent, 'utf-8')
      console.log('  ✓ Updated .env.example for email provider')
    }
  }
}

// =============================================================================
// Mobile Features Removal (webapp-only)
// =============================================================================

function removeMobileMarkers(content: string): string {
  // Remove lines with single-line "// mobile" marker comments
  let result = content.replace(/^.*\/\/\s*mobile\s*$/gm, '')

  // Remove blocks between // mobile:start and // mobile:end (including the markers)
  result = result.replace(
    /^[ \t]*\/\/[ \t]*mobile:start[ \t]*\n[\s\S]*?^[ \t]*\/\/[ \t]*mobile:end[ \t]*\n?/gm,
    ''
  )

  // Uncomment blocks between // webapp-only:start and // webapp-only:end
  result = result.replace(
    /^[ \t]*\/\/[ \t]*webapp-only:start[ \t]*\n([\s\S]*?)^[ \t]*\/\/[ \t]*webapp-only:end[ \t]*\n?/gm,
    (_match, block) => {
      return block.replace(/^(\s*)\/\/ ?/gm, '$1')
    }
  )

  // Clean up excessive blank lines left behind (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

async function removeMobileFeatures(rootDir: string, dryRun: boolean): Promise<void> {
  // 1. Remove mobile-redirect route (if it has been ported to Vite)
  const mobileRedirectRoute = join(rootDir, 'apps/webapp/src/routes/auth/mobile-redirect.tsx')
  if (existsSync(mobileRedirectRoute)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove apps/webapp/src/routes/auth/mobile-redirect.tsx')
    } else {
      await rm(mobileRedirectRoute, { force: true })
      console.log('  ✓ Removed apps/webapp/src/routes/auth/mobile-redirect.tsx')
    }
  }

  // 2. Strip mobile-specific code from backend auth config
  const filesToEdit = ['apps/api/src/auth.ts']

  for (const file of filesToEdit) {
    const fullPath = join(rootDir, file)
    if (!existsSync(fullPath)) continue

    const content = await readFile(fullPath, 'utf-8')
    const cleaned = removeMobileMarkers(content)

    if (content !== cleaned) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would strip mobile code from ${file}`)
      } else {
        await writeFile(fullPath, cleaned, 'utf-8')
        console.log(`  ✓ Stripped mobile code from ${file}`)
      }
    }
  }
}

// =============================================================================
// Component Selection
// =============================================================================

async function removeUnselectedApps(
  rootDir: string,
  components: ComponentSelection,
  dryRun: boolean
): Promise<void> {
  if (components === 'both') {
    return
  }

  const appsToRemove: string[] = []
  const scriptsToRemove: string[] = []

  if (components === 'webapp') {
    appsToRemove.push('mobile')
    scriptsToRemove.push('mobile', 'mobile:ios', 'mobile:android', 'mobile:web')
  } else if (components === 'mobile') {
    appsToRemove.push('webapp')
    scriptsToRemove.push('webapp', 'dev')
  }

  // Remove app directories
  for (const app of appsToRemove) {
    const appDir = join(rootDir, 'apps', app)
    if (existsSync(appDir)) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would remove apps/${app}/`)
      } else {
        await rm(appDir, { recursive: true, force: true })
        console.log(`  ✓ Removed apps/${app}/`)
      }
    }
  }

  // Update package.json to remove scripts
  const packageJsonPath = join(rootDir, 'package.json')
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

    let modified = false

    if (packageJson.scripts) {
      for (const script of scriptsToRemove) {
        if (packageJson.scripts[script]) {
          if (dryRun) {
            console.log(`  [DRY-RUN] Would remove script "${script}"`)
          } else {
            delete packageJson.scripts[script]
            modified = true
          }
        }
      }
    }

    // Remove workspace entries for removed apps
    if (packageJson.workspaces?.packages) {
      const workspacePackages = packageJson.workspaces.packages as string[]
      for (const app of appsToRemove) {
        const idx = workspacePackages.indexOf(`apps/${app}`)
        if (idx !== -1) {
          if (dryRun) {
            console.log(`  [DRY-RUN] Would remove workspace "apps/${app}"`)
          } else {
            workspacePackages.splice(idx, 1)
            modified = true
          }
        }
      }
    }

    if (modified && !dryRun) {
      await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
      console.log('  ✓ Updated package.json scripts and workspaces')
    }
  }
}

// =============================================================================
// Minimal Mode (Strip to DDD Monorepo)
// =============================================================================

async function cleanCommonPackage(rootDir: string, dryRun: boolean): Promise<void> {
  const commonDir = join(rootDir, 'packages', 'common')

  // Remove domain/repositories/ directory
  const domainReposDir = join(commonDir, 'domain', 'repositories')
  if (existsSync(domainReposDir)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove packages/common/domain/repositories/')
    } else {
      await rm(domainReposDir, { recursive: true, force: true })
      console.log('  ✓ Removed packages/common/domain/repositories/')
    }
  }

  // Remove infrastructure/repositories/ directory
  const infraReposDir = join(commonDir, 'infrastructure', 'repositories')
  if (existsSync(infraReposDir)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove packages/common/infrastructure/repositories/')
    } else {
      await rm(infraReposDir, { recursive: true, force: true })
      console.log('  ✓ Removed packages/common/infrastructure/repositories/')
    }
  }

  // Update domain/index.ts - remove repository exports
  const domainIndexPath = join(commonDir, 'domain', 'index.ts')
  if (existsSync(domainIndexPath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would update packages/common/domain/index.ts')
    } else {
      let content = await readFile(domainIndexPath, 'utf-8')
      const lines = content.split('\n')
      const filtered = lines.filter((line) => !line.includes('/repositories/'))
      content = filtered.join('\n')
      await writeFile(domainIndexPath, content, 'utf-8')
      console.log('  ✓ Updated packages/common/domain/index.ts')
    }
  }

  // Update infrastructure/index.ts - remove repository exports
  const infraIndexPath = join(commonDir, 'infrastructure', 'index.ts')
  if (existsSync(infraIndexPath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would update packages/common/infrastructure/index.ts')
    } else {
      let content = await readFile(infraIndexPath, 'utf-8')
      const lines = content.split('\n')
      const filtered = lines.filter((line) => !line.includes('/repositories/'))
      content = filtered.join('\n')
      await writeFile(infraIndexPath, content, 'utf-8')
      console.log('  ✓ Updated packages/common/infrastructure/index.ts')
    }
  }

  // Remove database workspace dependency from package.json
  const commonPkgPath = join(commonDir, 'package.json')
  if (existsSync(commonPkgPath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would update packages/common/package.json')
    } else {
      const commonPkg = JSON.parse(await readFile(commonPkgPath, 'utf-8'))
      if (commonPkg.dependencies) {
        for (const key of Object.keys(commonPkg.dependencies)) {
          if (key.endsWith('/database') && commonPkg.dependencies[key] === 'workspace:*') {
            delete commonPkg.dependencies[key]
          }
        }
      }
      await writeFile(commonPkgPath, `${JSON.stringify(commonPkg, null, 2)}\n`, 'utf-8')
      console.log('  ✓ Updated packages/common/package.json')
    }
  }
}

async function cleanRootPackageJson(rootDir: string, dryRun: boolean): Promise<void> {
  const packageJsonPath = join(rootDir, 'package.json')
  if (!existsSync(packageJsonPath)) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
  const scriptsToRemove = [
    'preinstall',
    'dev',
    'api',
    'webapp',
    'admin',
    'mobile',
    'mobile:ios',
    'mobile:android',
    'dbs',
    'db:sync'
  ]
  let modified = false

  if (packageJson.scripts) {
    for (const script of scriptsToRemove) {
      if (packageJson.scripts[script]) {
        if (dryRun) {
          console.log(`  [DRY-RUN] Would remove script "${script}"`)
        } else {
          delete packageJson.scripts[script]
          modified = true
        }
      }
    }
  }

  // Remove app workspace entries (all apps are removed in minimal mode)
  if (packageJson.workspaces?.packages) {
    const before = (packageJson.workspaces.packages as string[]).length
    packageJson.workspaces.packages = (packageJson.workspaces.packages as string[]).filter(
      (pkg: string) => !pkg.startsWith('apps/')
    )
    if ((packageJson.workspaces.packages as string[]).length !== before) {
      if (dryRun) {
        console.log('  [DRY-RUN] Would remove app workspace entries')
      } else {
        modified = true
      }
    }
  }

  if (packageJson.devDependencies?.concurrently) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove devDependency "concurrently"')
    } else {
      delete packageJson.devDependencies.concurrently
      modified = true
    }
  }

  if (modified && !dryRun) {
    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
    console.log('  ✓ Updated root package.json')
  }
}

async function stripToMinimalMonorepo(rootDir: string, dryRun: boolean): Promise<void> {
  // 1. Remove entire apps directory
  const appsDir = join(rootDir, 'apps')
  if (existsSync(appsDir)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove apps/')
    } else {
      await rm(appsDir, { recursive: true, force: true })
      console.log('  ✓ Removed apps/')
    }
  }

  // 2. Remove fullstack-only packages
  const packagesToRemove = ['database', 'auth', 'api', 'users']
  for (const pkg of packagesToRemove) {
    const pkgDir = join(rootDir, 'packages', pkg)
    if (existsSync(pkgDir)) {
      if (dryRun) {
        console.log(`  [DRY-RUN] Would remove packages/${pkg}/`)
      } else {
        await rm(pkgDir, { recursive: true, force: true })
        console.log(`  ✓ Removed packages/${pkg}/`)
      }
    }
  }

  // 3. Remove docker-compose.yml
  const dockerComposePath = join(rootDir, 'docker-compose.yml')
  if (existsSync(dockerComposePath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove docker-compose.yml')
    } else {
      await rm(dockerComposePath)
      console.log('  ✓ Removed docker-compose.yml')
    }
  }

  // 4. Clean up packages/common
  await cleanCommonPackage(rootDir, dryRun)

  // 5. Simplify .env.example
  const envExamplePath = join(rootDir, '.env.example')
  if (existsSync(envExamplePath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would simplify .env.example')
    } else {
      await writeFile(envExamplePath, '# Add your environment variables here\n', 'utf-8')
      console.log('  ✓ Simplified .env.example')
    }
  }

  // 6. Remove .env.local if it exists
  const envLocalPath = join(rootDir, '.env.local')
  if (existsSync(envLocalPath)) {
    if (dryRun) {
      console.log('  [DRY-RUN] Would remove .env.local')
    } else {
      await rm(envLocalPath)
      console.log('  ✓ Removed .env.local')
    }
  }

  // 7. Clean up root package.json
  await cleanRootPackageJson(rootDir, dryRun)
}

// =============================================================================
// Progress Display
// =============================================================================

function createProgressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${bar}] ${percentage}% (${current}/${total})`
}

function clearLine(): void {
  process.stdout.write('\r\x1b[K')
}

// =============================================================================
// Interactive Prompts
// =============================================================================

async function promptForConfig(
  rl: ReturnType<typeof createInterface>,
  cliConfig: Partial<Config>
): Promise<Config> {
  let projectName = cliConfig.projectName
  let projectIdentifier = cliConfig.projectIdentifier
  let projectDescription = cliConfig.projectDescription ?? ''

  // Project name
  if (!projectName) {
    while (true) {
      projectName = await rl.question('Project name (e.g., my-awesome-project): ')
      const validation = validateProjectName(projectName)
      if (validation.valid) break
      console.log(`  ❌ ${validation.error}`)
    }
  }

  // Project identifier
  if (!projectIdentifier) {
    const suggestedId = `@${projectName
      .split('-')
      .map((w) => w[0])
      .join('')}`
    while (true) {
      projectIdentifier = await rl.question(
        `Project identifier (e.g., ${suggestedId} for ${projectName}): `
      )
      const validation = validateProjectIdentifier(projectIdentifier)
      if (validation.valid) break
      console.log(`  ❌ ${validation.error}`)
    }
  }

  // Project description
  if (!projectDescription && cliConfig.projectDescription === undefined) {
    projectDescription = await rl.question('Project description (optional): ')
  }

  // Components selection
  let components: ComponentSelection = cliConfig.components ?? 'both'
  if (!cliConfig.components) {
    console.log('\nWhich components do you want to include?')
    console.log('  1. Both (Webapp + Mobile App) [default]')
    console.log('  2. Webapp only (Vite SPA web application)')
    console.log('  3. Mobile only (Expo mobile app)')
    console.log('  4. None (Minimal DDD monorepo, no apps/database)')
    const componentsInput = await rl.question('Selection (1/2/3/4): ')
    if (componentsInput === '2') {
      components = 'webapp'
    } else if (componentsInput === '3') {
      components = 'mobile'
    } else if (componentsInput === '4') {
      components = 'none'
    } else {
      components = 'both'
    }
  }

  // Database/Redis configuration (skip for minimal mode)
  let postgresPort = cliConfig.postgresPort ?? 5432
  let includeRedis = cliConfig.includeRedis ?? components !== 'none'
  let redisPort = cliConfig.redisPort ?? 6379

  if (components !== 'none') {
    // PostgreSQL port
    if (!cliConfig.postgresPort) {
      const postgresPortInput = await rl.question('\nPostgreSQL port (default 5432): ')
      if (postgresPortInput) {
        postgresPort = parseInt(postgresPortInput, 10) || 5432
      }
    }

    // Include Redis?
    if (cliConfig.includeRedis === undefined) {
      const includeRedisInput = await rl.question('Include Redis? (yes/no, default yes): ')
      includeRedis =
        includeRedisInput.toLowerCase() !== 'no' && includeRedisInput.toLowerCase() !== 'n'
    }

    // Redis port (only if Redis is included)
    if (includeRedis && !cliConfig.redisPort) {
      const redisPortInput = await rl.question('Redis port (default 6379): ')
      if (redisPortInput) {
        redisPort = parseInt(redisPortInput, 10) || 6379
      }
    }
  }

  // SaaS features?
  let isSaas = cliConfig.isSaas ?? true
  if (cliConfig.isSaas === undefined) {
    const isSaasInput = await rl.question(
      '\nIs this a SaaS project? Includes roles and admin panel (yes/no, default yes): '
    )
    isSaas = isSaasInput.toLowerCase() !== 'no' && isSaasInput.toLowerCase() !== 'n'
  }

  // Email provider
  let emailProvider: EmailProvider = cliConfig.emailProvider ?? 'sendgrid'
  if (!cliConfig.emailProvider) {
    console.log('\nWhich email provider do you want to use?')
    console.log('  1. SendGrid (default) — Uses nodemailer with SMTP transport')
    console.log('  2. Resend — Uses Resend SDK with API key')
    const emailInput = await rl.question('Selection (1/2): ')
    if (emailInput === '2') {
      emailProvider = 'resend'
    } else {
      emailProvider = 'sendgrid'
    }
  }

  return {
    projectName,
    projectIdentifier,
    projectDescription,
    postgresPort,
    redisPort,
    includeRedis,
    isSaas,
    emailProvider,
    components,
    dryRun: cliConfig.dryRun ?? false,
    verbose: cliConfig.verbose ?? false,
    skipGitCheck: cliConfig.skipGitCheck ?? false,
    noBackup: cliConfig.noBackup ?? false
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const cliConfig = parseCliArgs()
  const isInteractive = !cliConfig.projectName || !cliConfig.projectIdentifier

  let rl: ReturnType<typeof createInterface> | null = null

  if (isInteractive) {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  try {
    console.log('\n🚀 Monorepo Boilerplate - Project Initialization\n')

    if (cliConfig.dryRun) {
      console.log('📋 DRY-RUN MODE - No changes will be made\n')
    }

    const rootDir = resolveRootDir()

    // Git status check
    if (!cliConfig.skipGitCheck) {
      const gitStatus = await checkGitStatus(rootDir)
      if (!gitStatus.clean) {
        console.log(`⚠️  ${gitStatus.message}`)
        if (isInteractive && rl) {
          const proceed = await rl.question('Continue anyway? (yes/no): ')
          if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
            console.log('❌ Initialization cancelled')
            rl.close()
            process.exit(0)
          }
        }
        console.log('')
      }
    }

    // Get configuration
    let config: Config

    if (isInteractive && rl) {
      config = await promptForConfig(rl, cliConfig)
    } else {
      if (!cliConfig.projectName || !cliConfig.projectIdentifier) {
        console.error('❌ Project name and identifier are required in non-interactive mode')
        process.exit(1)
      }
      const components = cliConfig.components ?? 'both'
      config = {
        projectName: cliConfig.projectName,
        projectIdentifier: cliConfig.projectIdentifier,
        projectDescription: cliConfig.projectDescription ?? '',
        postgresPort: cliConfig.postgresPort ?? 5432,
        redisPort: cliConfig.redisPort ?? 6379,
        includeRedis: cliConfig.includeRedis ?? components !== 'none',
        isSaas: cliConfig.isSaas ?? true,
        emailProvider: cliConfig.emailProvider ?? 'sendgrid',
        components,
        dryRun: cliConfig.dryRun ?? false,
        verbose: cliConfig.verbose ?? false,
        skipGitCheck: cliConfig.skipGitCheck ?? false,
        noBackup: cliConfig.noBackup ?? false
      }
    }

    // Validate non-interactive config
    if (!isInteractive) {
      const nameValidation = validateProjectName(config.projectName)
      if (!nameValidation.valid) {
        console.error(`❌ ${nameValidation.error}`)
        process.exit(1)
      }

      const idValidation = validateProjectIdentifier(config.projectIdentifier)
      if (!idValidation.valid) {
        console.error(`❌ ${idValidation.error}`)
        process.exit(1)
      }
    }

    // Scan files
    console.log('🔍 Scanning project files...')
    const files = await findFiles(rootDir, EXTENSIONS_TO_UPDATE)

    // Analyze files
    process.stdout.write('📊 Analyzing files... ')
    const changes = await analyzeFiles(files, rootDir, (current, total) => {
      clearLine()
      process.stdout.write(`📊 Analyzing files... ${createProgressBar(current, total)}`)
    })
    clearLine()
    console.log(`📊 Analyzed ${files.length} files, ${changes.length} will be updated\n`)

    if (changes.length === 0) {
      console.log('✅ No files need to be updated. Project may already be initialized.')
      rl?.close()
      process.exit(0)
    }

    // Show configuration summary
    console.log('📝 Configuration:')
    console.log(`  Name: ${CURRENT_NAME} → ${config.projectName}`)
    console.log(`  Identifier: ${CURRENT_IDENTIFIER} → ${config.projectIdentifier}`)
    if (config.components !== 'none') {
      console.log(`  App scheme: ${CURRENT_APP_SCHEME} → ${config.projectName}`)
    }
    if (config.projectDescription) {
      console.log(`  Description: ${CURRENT_DESCRIPTION} → ${config.projectDescription}`)
    }
    if (config.components !== 'none') {
      console.log(`  PostgreSQL port: ${config.postgresPort}`)
      if (config.includeRedis) {
        console.log(`  Redis port: ${config.redisPort}`)
      } else {
        console.log('  Redis: not included')
      }
    }
    const componentsLabel =
      config.components === 'both'
        ? 'Webapp + Mobile App'
        : config.components === 'webapp'
          ? 'Webapp only'
          : config.components === 'mobile'
            ? 'Mobile App only'
            : 'None (minimal DDD monorepo)'
    console.log(
      `  SaaS features: ${config.isSaas ? 'included (roles, admin panel)' : 'not included'}`
    )
    console.log(
      `  Email provider: ${config.emailProvider === 'resend' ? 'Resend (SDK)' : 'SendGrid (SMTP)'}`
    )
    console.log(`  Components: ${componentsLabel}`)
    console.log(`\n📁 Files to update: ${changes.length}`)

    if (config.verbose || changes.length <= 15) {
      for (const change of changes) {
        const tags: string[] = []
        if (change.hasIdentifier) tags.push('identifier')
        if (change.hasName) tags.push('name')
        if (change.hasAppScheme) tags.push('scheme')
        if (change.hasDescription) tags.push('description')
        console.log(`  • ${change.relativePath} (${tags.join(', ')})`)
      }
    } else {
      // Show first 10 and summary
      for (const change of changes.slice(0, 10)) {
        console.log(`  • ${change.relativePath}`)
      }
      console.log(`  ... and ${changes.length - 10} more files`)
    }

    // Confirmation
    if (isInteractive && rl) {
      const confirm = await rl.question(
        `\nProceed with ${config.dryRun ? 'dry-run' : 'initialization'}? (yes/no): `
      )
      rl.close()

      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('❌ Initialization cancelled')
        process.exit(0)
      }
    }

    // Create backup
    let backup: BackupInfo | null = null
    if (!config.dryRun && !config.noBackup) {
      console.log('\n💾 Creating backup...')
      backup = await createBackup(changes, rootDir)
      console.log(`  Backup saved to: ${basename(backup.dir)}`)
    }

    // Apply changes
    console.log(`\n🔄 ${config.dryRun ? 'Previewing' : 'Applying'} changes...`)

    try {
      const { successful, failed } = await applyChanges(changes, config, (current, total) => {
        if (!config.verbose) {
          clearLine()
          process.stdout.write(`  ${createProgressBar(current, total)}`)
        }
      })

      if (!config.verbose) {
        clearLine()
      }

      if (failed.length > 0) {
        console.log(`\n⚠️  ${failed.length} file(s) failed to update:`)
        for (const file of failed) {
          console.log(`  • ${file}`)
        }

        // Backup is preserved for manual recovery if needed
        if (backup && !config.dryRun) {
          console.log(`\n💾 Backup preserved for recovery: .init-backup/${basename(backup.dir)}`)
        }
      }

      if (config.components === 'none') {
        console.log('\n🗑️  Stripping to minimal DDD monorepo...')
        await stripToMinimalMonorepo(rootDir, config.dryRun)
      } else {
        // Setup .env.local
        if (!config.dryRun) {
          await setupEnvFile(rootDir, config)
        }

        // Remove unselected apps
        if (config.components !== 'both') {
          console.log('\n🗑️  Removing unselected components...')
          await removeUnselectedApps(rootDir, config.components, config.dryRun)
        }

        // Remove mobile auth flow when webapp-only
        if (config.components === 'webapp') {
          console.log('\n📱 Removing mobile auth flow...')
          await removeMobileFeatures(rootDir, config.dryRun)
        }

        // Remove Redis if not included
        if (!config.includeRedis) {
          console.log('\n🗑️  Removing Redis configuration...')
          await removeRedisFromProject(rootDir, config.dryRun)
        }

        // Remove SaaS features if not a SaaS project
        if (!config.isSaas) {
          console.log('\n🗑️  Removing SaaS features...')
          await removeSaasFeatures(rootDir, config.dryRun)
        }

        // Configure email provider
        console.log('\n📧 Configuring email provider...')
        await removeUnusedEmailProvider(rootDir, config.emailProvider, config.dryRun)

        // Detect and configure container runtime
        console.log('\n🐳 Configuring container runtime...')
        const runtime = await detectContainerRuntime()
        if (runtime) {
          console.log(`  Detected: ${runtime}`)
          await updateContainerRuntime(rootDir, runtime, config.dryRun)
        } else {
          console.log('  ⚠️  No container runtime detected (Docker/Podman)')
          console.log('  Install Docker or Podman to use database services')
        }
      }

      // Success message
      console.log(`\n✅ ${config.dryRun ? 'Dry-run' : 'Project initialization'} complete!`)
      console.log(`   ${successful} file(s) ${config.dryRun ? 'would be' : ''} updated`)
      console.log(`   ${CURRENT_IDENTIFIER} → ${config.projectIdentifier}`)
      console.log(`   ${CURRENT_NAME} → ${config.projectName}`)
      if (config.components !== 'none') {
        console.log(`   ${CURRENT_APP_SCHEME} → ${config.projectName} (app scheme)`)
      }

      if (!config.dryRun) {
        // Cleanup backup on success
        if (backup && failed.length === 0) {
          await cleanupBackup(backup.dir)
        } else if (backup) {
          console.log(`\n💾 Backup preserved at: .init-backup/${basename(backup.dir)}`)
        }

        console.log('\n📋 Next steps:')

        if (config.components === 'none') {
          console.log('  1. Review changes: git diff')
          console.log('  2. Install dependencies: bun install')
          console.log('  3. Run code check: bun run lint')
          console.log('  4. Update docs/development/roadmap.md with your project goals')
          console.log('  5. Create your first bounded context in packages/')
          console.log('  6. Start coding! \n')
        } else {
          console.log('  1. Review changes: git diff')
          console.log('  2. Install dependencies: bun install')
          console.log('  3. Start database services: bun run dbs')
          console.log('  4. Sync database schema: bun run db:sync')

          if (config.components === 'both' || config.components === 'webapp') {
            console.log('  5. Start webapp: bun run webapp')
          }
          if (config.components === 'both' || config.components === 'mobile') {
            console.log(
              `  ${config.components === 'both' ? '6' : '5'}. Start mobile app: bun run mobile`
            )
          }

          const nextStep = config.components === 'both' ? 7 : 6
          console.log(`  ${nextStep}. Update docs/development/roadmap.md with your project goals`)
          console.log(`  ${nextStep + 1}. Setup Slack notifications (optional):`)
          console.log(
            `     /github subscribe elevenyellow/${config.projectName} commits pulls reviews`
          )
          console.log(`  ${nextStep + 2}. Start coding! \n`)
        }
      } else {
        console.log('\n💡 Run without --dry-run to apply changes')
      }
    } catch (error) {
      console.error('\n❌ Error during initialization:', error)

      if (backup && !config.dryRun) {
        console.log('\n🔄 Attempting to restore from backup...')
        await restoreBackup(backup)
      }

      process.exit(1)
    }
  } catch (error) {
    console.error('Error during initialization:', error)
    rl?.close()
    process.exit(1)
  }
}

main().catch(console.error)
