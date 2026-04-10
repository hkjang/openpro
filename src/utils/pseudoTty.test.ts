import { describe, expect, test } from 'bun:test'

import {
  getPseudoTtyFallbackSize,
  isMinttyLikeTerminal,
  shouldTreatStdoutAsInteractive,
} from './pseudoTty.js'

describe('pseudoTty', () => {
  test('detects mintty-like terminals from MSYSTEM on Windows', () => {
    expect(
      isMinttyLikeTerminal({ MSYSTEM: 'MINGW64' }, 'win32'),
    ).toBe(true)
  })

  test('does not detect mintty-like terminals outside Windows without TERM_PROGRAM', () => {
    expect(isMinttyLikeTerminal({}, 'linux')).toBe(false)
  })

  test('treats mintty-like stdout as interactive when stdout.isTTY is false', () => {
    const stdout = { isTTY: false } as NodeJS.WriteStream

    expect(
      shouldTreatStdoutAsInteractive(stdout, { MSYSTEM: 'MINGW64' }, 'win32'),
    ).toBe(true)
  })

  test('does not force pseudo-tty mode in CI', () => {
    const stdout = { isTTY: false } as NodeJS.WriteStream

    expect(
      shouldTreatStdoutAsInteractive(
        stdout,
        { MSYSTEM: 'MINGW64', CI: '1' },
        'win32',
      ),
    ).toBe(false)
  })

  test('prefers explicit terminal size env vars for pseudo-tty fallbacks', () => {
    const stdout = {
      isTTY: false,
      columns: undefined,
      rows: undefined,
    } as NodeJS.WriteStream
    const stderr = {
      columns: undefined,
      rows: undefined,
    } as NodeJS.WriteStream

    expect(
      getPseudoTtyFallbackSize(
        stdout,
        stderr,
        {
          MSYSTEM: 'MINGW64',
          COLUMNS: '120',
          LINES: '40',
        },
        'win32',
      ),
    ).toEqual({
      columns: 120,
      rows: 40,
    })
  })
})
