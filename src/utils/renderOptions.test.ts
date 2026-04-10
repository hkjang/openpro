import { afterEach, describe, expect, test } from 'bun:test'

const originalCI = process.env.CI
const originalCOLUMNS = process.env.COLUMNS
const originalLINES = process.env.LINES
const originalMSYSTEM = process.env.MSYSTEM
const originalArgv = [...process.argv]
const stdinIsTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
const stdoutIsTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY')
const stdoutColumnsDescriptor = Object.getOwnPropertyDescriptor(
  process.stdout,
  'columns',
)
const stdoutRowsDescriptor = Object.getOwnPropertyDescriptor(
  process.stdout,
  'rows',
)
const stderrColumnsDescriptor = Object.getOwnPropertyDescriptor(
  process.stderr,
  'columns',
)
const stderrRowsDescriptor = Object.getOwnPropertyDescriptor(
  process.stderr,
  'rows',
)

async function importFreshModule() {
  return import(`./renderOptions.ts?ts=${Date.now()}-${Math.random()}`)
}

describe('getBaseRenderOptions', () => {
  afterEach(() => {
    if (originalCI === undefined) {
      delete process.env.CI
    } else {
      process.env.CI = originalCI
    }
    if (originalMSYSTEM === undefined) {
      delete process.env.MSYSTEM
    } else {
      process.env.MSYSTEM = originalMSYSTEM
    }
    if (originalCOLUMNS === undefined) {
      delete process.env.COLUMNS
    } else {
      process.env.COLUMNS = originalCOLUMNS
    }
    if (originalLINES === undefined) {
      delete process.env.LINES
    } else {
      process.env.LINES = originalLINES
    }
    process.argv = [...originalArgv]
    if (stdinIsTTYDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinIsTTYDescriptor)
    }
    if (stdoutIsTTYDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutIsTTYDescriptor)
    }
    if (stdoutColumnsDescriptor) {
      Object.defineProperty(process.stdout, 'columns', stdoutColumnsDescriptor)
    }
    if (stdoutRowsDescriptor) {
      Object.defineProperty(process.stdout, 'rows', stdoutRowsDescriptor)
    }
    if (stderrColumnsDescriptor) {
      Object.defineProperty(process.stderr, 'columns', stderrColumnsDescriptor)
    }
    if (stderrRowsDescriptor) {
      Object.defineProperty(process.stderr, 'rows', stderrRowsDescriptor)
    }
  })

  test('opens a TTY stdin override on Windows when stdin is not interactive', async () => {
    if (process.platform !== 'win32') {
      return
    }

    delete process.env.CI
    process.argv = ['node', 'openpro']
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })

    const { getBaseRenderOptions } = await importFreshModule()
    const options = getBaseRenderOptions(false)

    expect(options.stdin).toBeDefined()
    expect(options.stdin?.isTTY).toBe(true)
    expect(typeof options.stdin?.setRawMode).toBe('function')

    options.stdin?.destroy()
  })

  test('returns a tty-like stdout override for mintty on Windows', async () => {
    if (process.platform !== 'win32') {
      return
    }

    delete process.env.CI
    process.env.MSYSTEM = 'MINGW64'
    process.argv = ['node', 'openpro']
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })

    const { getBaseRenderOptions } = await importFreshModule()
    const options = getBaseRenderOptions(false)

    expect(options.stdout).toBeDefined()
    expect(options.stdout?.isTTY).toBe(true)
  })

  test('uses terminal size env vars for mintty stdout fallback when present', async () => {
    if (process.platform !== 'win32') {
      return
    }

    delete process.env.CI
    process.env.MSYSTEM = 'MINGW64'
    process.env.COLUMNS = '132'
    process.env.LINES = '43'
    process.argv = ['node', 'openpro']
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(process.stdout, 'columns', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(process.stdout, 'rows', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(process.stderr, 'columns', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(process.stderr, 'rows', {
      configurable: true,
      value: undefined,
    })

    const { getBaseRenderOptions } = await importFreshModule()
    const options = getBaseRenderOptions(false)

    expect(options.stdout?.columns).toBe(132)
    expect(options.stdout?.rows).toBe(43)
  })

  test('falls back to stderr terminal size before defaulting to 80x24', async () => {
    if (process.platform !== 'win32') {
      return
    }

    delete process.env.CI
    delete process.env.COLUMNS
    delete process.env.LINES
    process.env.MSYSTEM = 'MINGW64'
    process.argv = ['node', 'openpro']
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(process.stdout, 'columns', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(process.stdout, 'rows', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(process.stderr, 'columns', {
      configurable: true,
      value: 118,
    })
    Object.defineProperty(process.stderr, 'rows', {
      configurable: true,
      value: 39,
    })

    const { getBaseRenderOptions } = await importFreshModule()
    const options = getBaseRenderOptions(false)

    expect(options.stdout?.columns).toBe(118)
    expect(options.stdout?.rows).toBe(39)
  })

  test('reopens CONIN$ for mintty on Windows even when stdin already reports as a TTY', async () => {
    if (process.platform !== 'win32') {
      return
    }

    delete process.env.CI
    process.env.MSYSTEM = 'MINGW64'
    process.argv = ['node', 'openpro']
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    })

    const { getBaseRenderOptions } = await importFreshModule()
    const options = getBaseRenderOptions(false)

    expect(options.stdin).toBeDefined()
    expect(options.stdin).not.toBe(process.stdin)

    options.stdin?.destroy()
  })
})
