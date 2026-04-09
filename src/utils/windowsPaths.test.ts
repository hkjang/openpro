import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const originalGitBashPath = process.env.CLAUDE_CODE_GIT_BASH_PATH

async function importFreshModule() {
  return import(`./windowsPaths.ts?ts=${Date.now()}-${Math.random()}`)
}

describe('findGitBashPath', () => {
  afterEach(() => {
    if (originalGitBashPath === undefined) {
      delete process.env.CLAUDE_CODE_GIT_BASH_PATH
    } else {
      process.env.CLAUDE_CODE_GIT_BASH_PATH = originalGitBashPath
    }
  })

  test('accepts an existing CLAUDE_CODE_GIT_BASH_PATH without shelling out', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openpro-gitbash-'))
    const bashPath = join(dir, 'bash.exe')
    writeFileSync(bashPath, '')
    process.env.CLAUDE_CODE_GIT_BASH_PATH = bashPath

    try {
      const { findGitBashPath } = await importFreshModule()
      expect(findGitBashPath()).toBe(bashPath)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
