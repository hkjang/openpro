import { expect, test } from 'bun:test'
import { feature } from './feature.js'

test('internal-only features stay disabled in the open build', () => {
  expect(feature('KAIROS_DREAM')).toBe(false)
  expect(feature('KAIROS_PUSH_NOTIFICATION')).toBe(false)
  expect(feature('KAIROS_GITHUB_WEBHOOKS')).toBe(false)
  expect(feature('AGENT_TRIGGERS_REMOTE')).toBe(false)
  expect(feature('REACTIVE_COMPACT')).toBe(false)
  expect(feature('EXPERIMENTAL_SKILL_SEARCH')).toBe(false)
  expect(feature('HISTORY_SNIP')).toBe(false)
  expect(feature('REVIEW_ARTIFACT')).toBe(false)
  expect(feature('BUILDING_CLAUDE_APPS')).toBe(false)
  expect(feature('RUN_SKILL_GENERATOR')).toBe(false)
})
