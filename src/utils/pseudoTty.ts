import { spawnSync } from 'child_process'
import { isEnvTruthy } from './envUtils.js'

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseTerminalSizeFromStty(
  value: string | undefined,
): { columns?: number; rows?: number } {
  if (!value) {
    return {}
  }

  const match = value.trim().match(/^(\d+)\s+(\d+)$/)
  if (!match) {
    return {}
  }

  const rows = parsePositiveInteger(match[1])
  const columns = parsePositiveInteger(match[2])

  return { columns, rows }
}

function probePseudoTtySize(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): { columns?: number; rows?: number } {
  if (!isMinttyLikeTerminal(env, platform)) {
    return {}
  }

  try {
    const stty = spawnSync('stty', ['size'], {
      encoding: 'utf8',
      env,
      stdio: ['inherit', 'pipe', 'ignore'],
      timeout: 250,
      windowsHide: true,
    })

    if (stty.status === 0) {
      const parsed = parseTerminalSizeFromStty(stty.stdout)
      if (parsed.columns || parsed.rows) {
        return parsed
      }
    }
  } catch {
    // Best-effort probe only.
  }

  const columns = (() => {
    try {
      const result = spawnSync('tput', ['cols'], {
        encoding: 'utf8',
        env,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 250,
        windowsHide: true,
      })
      return result.status === 0
        ? parsePositiveInteger(result.stdout?.trim())
        : undefined
    } catch {
      return undefined
    }
  })()

  const rows = (() => {
    try {
      const result = spawnSync('tput', ['lines'], {
        encoding: 'utf8',
        env,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 250,
        windowsHide: true,
      })
      return result.status === 0
        ? parsePositiveInteger(result.stdout?.trim())
        : undefined
    } catch {
      return undefined
    }
  })()

  return { columns, rows }
}

export function isMinttyLikeTerminal(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (env.TERM_PROGRAM === 'mintty') {
    return true
  }

  if (platform === 'win32' && env.MSYSTEM) {
    return true
  }

  return false
}

export function shouldTreatStdoutAsInteractive(
  stdout: NodeJS.WriteStream = process.stdout,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (stdout.isTTY) {
    return true
  }

  return !isEnvTruthy(env.CI) && isMinttyLikeTerminal(env, platform)
}

export function getPseudoTtyFallbackSize(
  stdout: NodeJS.WriteStream = process.stdout,
  stderr: NodeJS.WriteStream = process.stderr,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): { columns: number; rows: number } {
  const envColumns = parsePositiveInteger(env.COLUMNS)
  const envRows = parsePositiveInteger(env.LINES)
  const needsProbe =
    (stdout.columns == null && stderr.columns == null && envColumns == null) ||
    (stdout.rows == null && stderr.rows == null && envRows == null)
  const probedSize = needsProbe ? probePseudoTtySize(env, platform) : {}

  return {
    columns:
      stdout.columns ??
      stderr.columns ??
      envColumns ??
      probedSize.columns ??
      80,
    rows: stdout.rows ?? stderr.rows ?? envRows ?? probedSize.rows ?? 24,
  }
}

export function getPseudoTtyStdoutOverride(): NodeJS.WriteStream | undefined {
  if (!shouldTreatStdoutAsInteractive(process.stdout) || process.stdout.isTTY) {
    return undefined
  }

  const stdout = process.stdout
  const fallbackSize = getPseudoTtyFallbackSize()

  return new Proxy(stdout, {
    get(target, prop, _receiver) {
      if (prop === 'isTTY') {
        return true
      }

      if (prop === 'columns') {
        return target.columns ?? fallbackSize.columns
      }

      if (prop === 'rows') {
        return target.rows ?? fallbackSize.rows
      }

      const value = Reflect.get(target, prop, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
    set(target, prop, value, _receiver) {
      return Reflect.set(target, prop, value, target)
    },
  }) as NodeJS.WriteStream
}
