import { afterEach, describe, expect, test } from 'bun:test'

const originalCI = process.env.CI
const originalArgv = [...process.argv]
const stdinIsTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')

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
    process.argv = [...originalArgv]
    if (stdinIsTTYDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinIsTTYDescriptor)
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
})
