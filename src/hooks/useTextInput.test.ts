import { expect, test } from 'bun:test'

import type { Key } from '../ink.js'
import { extractCoalescedSubmitText } from './textInputSubmit.ts'

const defaultKey: Key = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  wheelUp: false,
  wheelDown: false,
  home: false,
  end: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  fn: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
  super: false,
}

test('detects CRLF-coalesced submit text', () => {
  expect(extractCoalescedSubmitText('안녕\r\n', defaultKey)).toBe('안녕')
})

test('detects LF-coalesced submit text', () => {
  expect(extractCoalescedSubmitText('hello\n', defaultKey)).toBe('hello')
})

test('detects pure CRLF submit chunk', () => {
  expect(extractCoalescedSubmitText('\r\n', defaultKey)).toBe('')
})

test('ignores explicit newline shortcuts', () => {
  expect(extractCoalescedSubmitText('hello\\\r\n', defaultKey)).toBeNull()
})

test('ignores actual return-key metadata', () => {
  expect(
    extractCoalescedSubmitText('hello\n', { ...defaultKey, return: true }),
  ).toBeNull()
})

test('ignores multiline text chunks', () => {
  expect(extractCoalescedSubmitText('hello\nworld\n', defaultKey)).toBeNull()
})
