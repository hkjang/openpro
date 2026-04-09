import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

type RootPackageManifest = {
  name?: string
  version?: string
  description?: string
  type?: string
  bin?: Record<string, string>
  files?: string[]
  dependencies?: Record<string, string>
  engines?: Record<string, string>
  repository?: { type?: string; url?: string }
  keywords?: string[]
  license?: string
  publishConfig?: Record<string, string>
}

type PackResult = {
  filename?: string
}

type CliOptions = {
  keepTemp: boolean
  prepareOnly: boolean
  skipBuild: boolean
}

const args = new Set(process.argv.slice(2))

if (args.has('--help')) {
  console.log(`Create a release .tgz that bundles runtime dependencies.

Usage:
  bun run scripts/pack-release.ts [--skip-build] [--prepare-only] [--keep-temp]

Options:
  --skip-build    Reuse the existing dist/ output instead of rebuilding first.
  --prepare-only  Stage the temporary package and stop before npm install / npm pack.
  --keep-temp     Keep the temporary packaging directory for inspection.
`)
  process.exit(0)
}

const options: CliOptions = {
  keepTemp: args.has('--keep-temp'),
  prepareOnly: args.has('--prepare-only'),
  skipBuild: args.has('--skip-build'),
}

const projectRoot = resolve('.')
const distPath = resolve(projectRoot, 'dist')
const cliEntryPath = resolve(distPath, 'cli.mjs')
const readmePath = resolve(projectRoot, 'README.md')
const rootPackageJsonPath = resolve(projectRoot, 'package.json')
const rootPackageLockPath = resolve(projectRoot, 'package-lock.json')
const tempRoot = mkdtempSync(join(tmpdir(), 'openpro-pack-release-'))
const tempPackageRoot = resolve(tempRoot, 'package')
const tempPackageJsonPath = resolve(tempPackageRoot, 'package.json')
const tempPackageLockPath = resolve(tempPackageRoot, 'package-lock.json')

function getExecutable(command: string): string {
  if (command === 'bun') {
    return process.execPath
  }

  if (process.platform === 'win32' && command === 'npm') {
    const npmCmdPath = resolve('C:\\Program Files\\nodejs', 'npm.cmd')
    if (existsSync(npmCmdPath)) {
      return npmCmdPath
    }

    return 'npm.cmd'
  }

  return command
}

function runCommand(
  command: string,
  commandArgs: string[],
  cwd: string,
): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(getExecutable(command), commandArgs, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', code => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(
        new Error(
          `${command} ${commandArgs.join(' ')} exited with code ${code ?? 'unknown'}`,
        ),
      )
    })

    child.on('error', rejectPromise)
  })
}

function runJsonCommand<T>(
  command: string,
  commandArgs: string[],
  cwd: string,
): Promise<T> {
  return new Promise((resolvePromise, rejectPromise) => {
    let stdout = ''

    const child = spawn(getExecutable(command), commandArgs, {
      cwd,
      stdio: ['inherit', 'pipe', 'inherit'],
      env: process.env,
    })

    child.stdout.on('data', chunk => {
      const text = chunk.toString()
      stdout += text
      process.stdout.write(text)
    })

    child.on('exit', code => {
      if (code !== 0) {
        rejectPromise(
          new Error(
            `${command} ${commandArgs.join(' ')} exited with code ${code ?? 'unknown'}`,
          ),
        )
        return
      }

      try {
        resolvePromise(JSON.parse(stdout) as T)
      } catch (error) {
        rejectPromise(
          new Error(
            `Failed to parse JSON output from ${command} ${commandArgs.join(' ')}: ${error instanceof Error ? error.message : String(error)}`,
          ),
        )
      }
    })

    child.on('error', rejectPromise)
  })
}

function copyPackagingInputs(): void {
  mkdirSync(tempPackageRoot, { recursive: true })
  cpSync(resolve(projectRoot, 'bin'), resolve(tempPackageRoot, 'bin'), {
    recursive: true,
  })
  cpSync(distPath, resolve(tempPackageRoot, 'dist'), { recursive: true })
  copyFileSync(readmePath, resolve(tempPackageRoot, 'README.md'))
  copyFileSync(rootPackageJsonPath, tempPackageJsonPath)
  copyFileSync(rootPackageLockPath, tempPackageLockPath)
}

function createPackManifest(rootManifest: RootPackageManifest): RootPackageManifest & {
  bundleDependencies: string[]
} {
  return {
    name: rootManifest.name,
    version: rootManifest.version,
    description: rootManifest.description,
    type: rootManifest.type,
    bin: rootManifest.bin,
    files: rootManifest.files,
    dependencies: rootManifest.dependencies,
    engines: rootManifest.engines,
    repository: rootManifest.repository,
    keywords: rootManifest.keywords,
    license: rootManifest.license,
    publishConfig: rootManifest.publishConfig,
    bundleDependencies: Object.keys(rootManifest.dependencies ?? {}).sort(),
  }
}

function readRootManifest(): RootPackageManifest {
  return JSON.parse(readFileSync(rootPackageJsonPath, 'utf8')) as RootPackageManifest
}

function writePackManifest(rootManifest: RootPackageManifest): void {
  const packManifest = createPackManifest(rootManifest)
  writeFileSync(
    tempPackageJsonPath,
    `${JSON.stringify(packManifest, null, 2)}\n`,
    'utf8',
  )
}

async function main(): Promise<void> {
  const rootManifest = readRootManifest()

  if (!options.skipBuild) {
    console.log('Building release bundle...')
    await runCommand('bun', ['run', 'build'], projectRoot)
  }

  if (!existsSync(cliEntryPath)) {
    throw new Error(
      `Missing ${cliEntryPath}. Run bun run build before packing the release artifact.`,
    )
  }

  if (!existsSync(readmePath)) {
    throw new Error(`Missing ${readmePath}.`)
  }

  if (!existsSync(rootPackageLockPath)) {
    throw new Error(
      `Missing ${rootPackageLockPath}. The release packer expects package-lock.json for deterministic npm installs.`,
    )
  }

  console.log(`Preparing temporary package at ${tempPackageRoot}`)
  copyPackagingInputs()

  if (options.prepareOnly) {
    writePackManifest(rootManifest)
    console.log('Prepared the release package layout without installing dependencies.')
    console.log(tempPackageRoot)
    return
  }

  console.log('Installing runtime dependencies into the temporary package...')
  await runCommand('npm', ['ci', '--omit=dev'], tempPackageRoot)

  writePackManifest(rootManifest)

  console.log('Packing bundled release tarball...')
  const packResults = await runJsonCommand<PackResult[]>(
    'npm',
    ['pack', '--json'],
    tempPackageRoot,
  )
  const tarballName = packResults[0]?.filename

  if (!tarballName) {
    throw new Error('npm pack did not return a tarball filename.')
  }

  const tarballSourcePath = resolve(tempPackageRoot, tarballName)
  const tarballTargetPath = resolve(projectRoot, tarballName)

  copyFileSync(tarballSourcePath, tarballTargetPath)
  console.log(`Created bundled release artifact: ${tarballTargetPath}`)
}

try {
  await main()
} finally {
  if (!options.keepTemp) {
    rmSync(tempRoot, { recursive: true, force: true })
  } else {
    console.log(`Kept temporary files at ${tempRoot}`)
  }
}
