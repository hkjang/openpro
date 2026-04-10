import { expect, test } from 'bun:test'

import {
  INITIAL_STATE,
  parseMultipleKeypresses,
  type ParsedKey,
} from '../parse-keypress.ts'
import { KeyboardEvent } from './keyboard-event.ts'

function createKeyboardEvent(sequence: string): KeyboardEvent {
  const [items] = parseMultipleKeypresses(INITIAL_STATE, sequence)

  expect(items).toHaveLength(1)

  return new KeyboardEvent(items[0] as ParsedKey)
}

test('normalizes LF enter to return for keydown handlers', () => {
  const event = createKeyboardEvent('\n')

  expect(event.key).toBe('return')
})

test('keeps printable characters unchanged', () => {
  const event = createKeyboardEvent('a')

  expect(event.key).toBe('a')
})
