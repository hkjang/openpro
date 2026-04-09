import { feature } from 'src/utils/feature.js'
import { shouldAutoEnableClaudeInChrome } from 'src/utils/claudeInChrome/setup.js'
import { registerBatchSkill } from './batch.js'
import { registerClaudeInChromeSkill } from './claudeInChrome.js'
import { registerDebugSkill } from './debug.js'
import { registerKeybindingsSkill } from './keybindings.js'
import { registerLoremIpsumSkill } from './loremIpsum.js'
import { registerRememberSkill } from './remember.js'
import { registerSimplifySkill } from './simplify.js'
import { registerSkillifySkill } from './skillify.js'
import { registerStuckSkill } from './stuck.js'
import { registerUpdateConfigSkill } from './updateConfig.js'
import { registerVerifySkill } from './verify.js'

function registerOptionalSkill(
  modulePath: string,
  exportName: string,
): void {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const skillModule = require(modulePath) as Record<string, unknown>
  /* eslint-enable @typescript-eslint/no-require-imports */
  const registerSkill = skillModule[exportName]
  if (typeof registerSkill === 'function') {
    registerSkill()
  }
}

/**
 * Initialize all bundled skills.
 * Called at startup to register skills that ship with the CLI.
 *
 * To add a new bundled skill:
 * 1. Create a new file in src/skills/bundled/ (e.g., myskill.ts)
 * 2. Export a register function that calls registerBundledSkill()
 * 3. Import and call that function here
 */
export function initBundledSkills(): void {
  registerUpdateConfigSkill()
  registerKeybindingsSkill()
  registerVerifySkill()
  registerDebugSkill()
  registerLoremIpsumSkill()
  registerSkillifySkill()
  registerRememberSkill()
  registerSimplifySkill()
  registerBatchSkill()
  registerStuckSkill()
  if (feature('KAIROS') || feature('KAIROS_DREAM')) {
    registerOptionalSkill('./dream.js', 'registerDreamSkill')
  }
  if (feature('REVIEW_ARTIFACT')) {
    registerOptionalSkill('./hunter.js', 'registerHunterSkill')
  }
  if (feature('AGENT_TRIGGERS')) {
    // /loop's isEnabled delegates to isKairosCronEnabled(); same lazy
    // per-invocation pattern as the cron tools. Registered unconditionally;
    // the skill's own isEnabled callback decides visibility.
    registerOptionalSkill('./loop.js', 'registerLoopSkill')
  }
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    registerOptionalSkill(
      './scheduleRemoteAgents.js',
      'registerScheduleRemoteAgentsSkill',
    )
  }
  if (feature('BUILDING_CLAUDE_APPS')) {
    registerOptionalSkill('./claudeApi.js', 'registerClaudeApiSkill')
  }
  if (shouldAutoEnableClaudeInChrome()) {
    registerClaudeInChromeSkill()
  }
  if (feature('RUN_SKILL_GENERATOR')) {
    registerOptionalSkill(
      './runSkillGenerator.js',
      'registerRunSkillGeneratorSkill',
    )
  }
}
