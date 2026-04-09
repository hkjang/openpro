import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const originalPlatform = process.platform

async function importFreshModule() {
  return import(`./rawRead.ts?ts=${Date.now()}-${Math.random()}`)
}

describe('rawRead startup safety', () => {
  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
  })

  afterEach(() => {
    mock.restore()
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  test('does not throw when execFile spawn fails synchronously', async () => {
    mock.module('child_process', () => ({
      execFile() {
        throw new Error('spawn EPERM')
      },
    }))

    const { fireRawRead } = await importFreshModule()
    await expect(fireRawRead()).resolves.toEqual({
      plistStdouts: null,
      hklmStdout: null,
      hkcuStdout: null,
    })
  })
})
