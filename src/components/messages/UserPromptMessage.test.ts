import { expect, test } from 'bun:test'

import { shouldUsePlainUserPromptLayout } from './userPromptLayout.js'

test('uses the plain prompt layout on Windows', () => {
  expect(shouldUsePlainUserPromptLayout(false, 'win32')).toBe(true)
})

test('preserves the plain prompt layout when brief mode already requested it', () => {
  expect(shouldUsePlainUserPromptLayout(true, 'linux')).toBe(true)
})

test('keeps the themed bubble layout off Windows by default', () => {
  expect(shouldUsePlainUserPromptLayout(false, 'linux')).toBe(false)
})
