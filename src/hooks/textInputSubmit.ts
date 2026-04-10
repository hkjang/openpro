import type { Key } from '../ink.js'

export function extractCoalescedSubmitText(
  input: string,
  key: Key,
): string | null {
  if (key.return || key.meta || key.shift || input.length === 0) {
    return null
  }

  const suffix = input.endsWith('\r\n')
    ? '\r\n'
    : input.endsWith('\r')
      ? '\r'
      : input.endsWith('\n')
        ? '\n'
        : null

  if (!suffix) {
    return null
  }

  const text = input.slice(0, -suffix.length)

  // Coalesced submit should only cover a single trailing line ending.
  // Actual multi-line text/paste should continue through the normal text path.
  if (text.includes('\r') || text.includes('\n')) {
    return null
  }

  // Backslash+Enter is an explicit newline affordance, not submit.
  if (text.endsWith('\\')) {
    return null
  }

  return text
}
