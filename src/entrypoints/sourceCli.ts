import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  version?: string
  name?: string
}

const macroValues = {
  VERSION: pkg.version ?? '0.0.0',
  DISPLAY_VERSION: pkg.version ?? '0.0.0',
  BUILD_TIME: '',
  ISSUES_EXPLAINER:
    'report the issue at https://github.com/hkjang/openpro/issues',
  PACKAGE_URL: pkg.name ?? '@hkjang/openpro',
  NATIVE_PACKAGE_URL: undefined,
  FEEDBACK_CHANNEL: 'https://github.com/hkjang/openpro/issues',
  VERSION_CHANGELOG: undefined,
}

if (typeof globalThis.MACRO === 'undefined') {
  globalThis.MACRO = macroValues
}

await import('./cli.tsx')
