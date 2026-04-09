/**
 * Bundle the CLI into dist/cli.mjs with esbuild.
 *
 * We bundle repo source, keep regular npm dependencies external, and stub
 * internal-only or unavailable modules so the public build can run from dist.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs'
import { extname, resolve } from 'path'
import { build, type Plugin } from 'esbuild'

const projectRoot = resolve('.')
const distDir = resolve(projectRoot, 'dist')
const outfile = resolve(distDir, 'cli.mjs')
const packageJsonPath = resolve(projectRoot, 'package.json')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  name?: string
  version?: string
}

const version = pkg.version ?? '0.0.0'
const packageUrl = pkg.name ?? '@hkjang/openpro'
const issuesUrl = 'https://github.com/hkjang/openpro/issues'
const sourceExtensions = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
]

const telemetryStubModules: Record<string, string> = {
  'services/analytics/index': `
export function stripProtoFields(metadata) { return metadata; }
export function attachAnalyticsSink() {}
export function logEvent() {}
export async function logEventAsync() {}
export function _resetForTesting() {}
`,
  'services/analytics/growthbook': `
const noop = () => {};
export function onGrowthBookRefresh() { return noop; }
export function hasGrowthBookEnvOverride() { return false; }
export function getAllGrowthBookFeatures() { return {}; }
export function getGrowthBookConfigOverrides() { return {}; }
export function setGrowthBookConfigOverride() {}
export function clearGrowthBookConfigOverrides() {}
export function getApiBaseUrlHost() { return undefined; }
export const initializeGrowthBook = async () => null;
export async function getFeatureValue_DEPRECATED(feature, defaultValue) { return defaultValue; }
export function getFeatureValue_CACHED_MAY_BE_STALE(feature, defaultValue) { return defaultValue; }
export function getFeatureValue_CACHED_WITH_REFRESH(feature, defaultValue) { return defaultValue; }
export function checkStatsigFeatureGate_CACHED_MAY_BE_STALE() { return false; }
export async function checkSecurityRestrictionGate() { return false; }
export async function checkGate_CACHED_OR_BLOCKING() { return false; }
export function refreshGrowthBookAfterAuthChange() {}
export function resetGrowthBook() {}
export async function refreshGrowthBookFeatures() {}
export function setupPeriodicGrowthBookRefresh() {}
export function stopPeriodicGrowthBookRefresh() {}
export async function getDynamicConfig_BLOCKS_ON_INIT(configName, defaultValue) { return defaultValue; }
export function getDynamicConfig_CACHED_MAY_BE_STALE(configName, defaultValue) { return defaultValue; }
`,
  'services/analytics/sink': `
export function initializeAnalyticsGates() {}
export function initializeAnalyticsSink() {}
`,
  'services/analytics/config': `
export function isAnalyticsDisabled() { return true; }
export function isFeedbackSurveyDisabled() { return true; }
`,
  'services/analytics/datadog': `
export const initializeDatadog = async () => false;
export async function shutdownDatadog() {}
export async function trackDatadogEvent() {}
`,
  'services/analytics/firstPartyEventLogger': `
export function getEventSamplingConfig() { return {}; }
export function shouldSampleEvent() { return null; }
export async function shutdown1PEventLogging() {}
export function is1PEventLoggingEnabled() { return false; }
export function logEventTo1P() {}
export function logGrowthBookExperimentTo1P() {}
export function initialize1PEventLogging() {}
export async function reinitialize1PEventLoggingIfConfigChanged() {}
`,
  'services/analytics/firstPartyEventLoggingExporter': `
export class FirstPartyEventLoggingExporter {
  async export(logs, resultCallback) { resultCallback({ code: 0 }); }
  async getQueuedEventCount() { return 0; }
  async shutdown() {}
  async forceFlush() {}
}
`,
  'services/analytics/metadata': `
export function sanitizeToolNameForAnalytics(toolName) { return toolName; }
export function isToolDetailsLoggingEnabled() { return false; }
export function isAnalyticsToolDetailsLoggingEnabled() { return false; }
export function mcpToolDetailsForAnalytics() { return {}; }
export function extractMcpToolDetails() { return undefined; }
export function extractSkillName() { return undefined; }
export function extractToolInputForTelemetry() { return undefined; }
export function getFileExtensionForAnalytics() { return undefined; }
export function getFileExtensionsFromBashCommand() { return undefined; }
export async function getEventMetadata() { return {}; }
export function to1PEventFormat() { return {}; }
`,
  'utils/telemetry/bigqueryExporter': `
export class BigQueryMetricsExporter {
  async export(metrics, resultCallback) { resultCallback({ code: 0 }); }
  async shutdown() {}
  async forceFlush() {}
  selectAggregationTemporality() { return 0; }
}
`,
  'utils/telemetry/perfettoTracing': `
export function initializePerfettoTracing() {}
export function isPerfettoTracingEnabled() { return false; }
export function registerAgent() {}
export function unregisterAgent() {}
export function startLLMRequestPerfettoSpan() { return ''; }
export function endLLMRequestPerfettoSpan() {}
export function startToolPerfettoSpan() { return ''; }
export function endToolPerfettoSpan() {}
export function startUserInputPerfettoSpan() { return ''; }
export function endUserInputPerfettoSpan() {}
export function emitPerfettoInstant() {}
export function emitPerfettoCounter() {}
export function startInteractionPerfettoSpan() { return ''; }
export function endInteractionPerfettoSpan() {}
export function getPerfettoEvents() { return []; }
export function resetPerfettoTracer() {}
export async function triggerPeriodicWriteForTesting() {}
export function evictStaleSpansForTesting() {}
export const MAX_EVENTS_FOR_TESTING = 0;
export function evictOldestEventsForTesting() {}
`,
  'utils/telemetry/sessionTracing': `
const noopSpan = {
  end() {},
  setAttribute() {},
  setStatus() {},
  recordException() {},
  addEvent() {},
  isRecording() { return false; },
};
export function isBetaTracingEnabled() { return false; }
export function isEnhancedTelemetryEnabled() { return false; }
export function startInteractionSpan() { return noopSpan; }
export function endInteractionSpan() {}
export function startLLMRequestSpan() { return noopSpan; }
export function endLLMRequestSpan() {}
export function startToolSpan() { return noopSpan; }
export function startToolBlockedOnUserSpan() { return noopSpan; }
export function endToolBlockedOnUserSpan() {}
export function startToolExecutionSpan() { return noopSpan; }
export function endToolExecutionSpan() {}
export function endToolSpan() {}
export function addToolContentEvent() {}
export function getCurrentSpan() { return null; }
export async function executeInSpan(spanName, fn) { return fn(noopSpan); }
export function startHookSpan() { return noopSpan; }
export function endHookSpan() {}
`,
  'utils/autoUpdater': `
export async function assertMinVersion() {}
export async function getMaxVersion() { return undefined; }
export async function getMaxVersionMessage() { return undefined; }
export function shouldSkipVersion() { return true; }
export function getLockFilePath() { return '/tmp/openpro-update.lock'; }
export async function checkGlobalInstallPermissions() { return { hasPermissions: false, npmPrefix: null }; }
export async function getLatestVersion() { return null; }
export async function getNpmDistTags() { return { latest: null, stable: null }; }
export async function getLatestVersionFromGcs() { return null; }
export async function getGcsDistTags() { return { latest: null, stable: null }; }
export async function getVersionHistory() { return []; }
export async function installGlobalPackage() { return 'success'; }
`,
  'utils/plugins/fetchTelemetry': `
export function logPluginFetch() {}
export function classifyFetchError() { return 'disabled'; }
`,
  'components/FeedbackSurvey/submitTranscriptShare': `
export async function submitTranscriptShare() { return { success: false }; }
`,
}

const internalFeatureStubModules: Record<string, string> = {
  'daemon/workerRegistry': `
export async function runDaemonWorker() {
  throw new Error('Daemon worker is unavailable in the open build.');
}
`,
  'daemon/main': `
export async function daemonMain() {
  throw new Error('Daemon mode is unavailable in the open build.');
}
`,
  'cli/bg': `
const unavailable = async () => {
  throw new Error('Background sessions are unavailable in the open build.');
};
export const psHandler = unavailable;
export const logsHandler = unavailable;
export const attachHandler = unavailable;
export const killHandler = unavailable;
export const handleBgFlag = unavailable;
`,
  'cli/handlers/templateJobs': `
export async function templatesMain() {
  throw new Error('Template jobs are unavailable in the open build.');
}
`,
  'environment-runner/main': `
export async function environmentRunnerMain() {
  throw new Error('Environment runner is unavailable in the open build.');
}
`,
  'self-hosted-runner/main': `
export async function selfHostedRunnerMain() {
  throw new Error('Self-hosted runner is unavailable in the open build.');
}
`,
}

const packageStubContents: Record<string, string> = {
  '@ant/computer-use-mcp': `
const noop = () => {};
export const DEFAULT_GRANT_FLAGS = {
  clipboardRead: false,
  clipboardWrite: false,
  systemKeyCombos: false,
};
export const API_RESIZE_PARAMS = {};
export function targetImageSize(width, height) { return [width, height]; }
export function buildComputerUseTools() { return []; }
export function createComputerUseMcpServer() {
  return {
    setRequestHandler: noop,
    connect: async () => {},
  };
}
export function bindSessionContext() {
  return async () => ({
    content: [{ type: 'text', text: 'Computer use is unavailable in this build.' }],
  });
}
`,
  '@ant/computer-use-mcp/types': `
export const DEFAULT_GRANT_FLAGS = {
  clipboardRead: false,
  clipboardWrite: false,
  systemKeyCombos: false,
};
`,
  '@ant/computer-use-mcp/sentinelApps': `
export function getSentinelCategory() { return undefined; }
`,
  '@ant/claude-for-chrome-mcp': `
export const BROWSER_TOOLS = [];
export function createClaudeForChromeMcpServer() {
  return {
    connect: async () => {},
  };
}
`,
  '@anthropic-ai/mcpb': `
const unavailableMessage = '@anthropic-ai/mcpb is unavailable in this build.';
export const McpbManifestSchema = {
  safeParse() {
    return {
      success: false,
      error: {
        flatten() {
          return {
            fieldErrors: {},
            formErrors: [unavailableMessage],
          };
        },
      },
    };
  },
};
export async function getMcpConfigForManifest() {
  return null;
}
`,
  'asciichart': `
export function plot() { return ''; }
`,
  'audio-capture-napi': `
export const __stub = true;
export function isNativeAudioAvailable() { return false; }
export function isNativeRecordingActive() { return false; }
export function startNativeRecording() { return false; }
export function stopNativeRecording() {}
export default {
  __stub,
  isNativeAudioAvailable,
  isNativeRecordingActive,
  startNativeRecording,
  stopNativeRecording,
};
`,
  'audio-capture.node': `
export default {};
`,
  'image-processor-napi': `
const unavailable = () => {
  throw new Error('Image processing is unavailable in this build.');
};
export const __stub = true;
export const sharp = unavailable;
export default unavailable;
`,
  'plist': `
export function parse() { return {}; }
export default { parse };
`,
  'cacache': `
export const ls = {
  stream() {
    return {
      on() { return this; },
      once() { return this; },
    };
  },
};
export const rm = {
  entry: async () => {},
};
export default { ls, rm };
`,
  'sharp': `
const sharp = () => {
  throw new Error('sharp is unavailable in this build.');
};
export const __stub = true;
export default sharp;
`,
  'modifiers-napi': `
export default {};
`,
  'url-handler-napi': `
export default {};
`,
  'color-diff-napi': `
export default {};
`,
}

function pushUnique(items: string[], value: string): void {
  if (!items.includes(value)) {
    items.push(value)
  }
}

function resolveExistingPath(basePath: string): string | null {
  const candidates: string[] = []
  const extension = extname(basePath)

  pushUnique(candidates, basePath)

  if (extension) {
    const withoutExtension = basePath.slice(0, -extension.length)
    for (const candidateExtension of sourceExtensions) {
      pushUnique(candidates, `${withoutExtension}${candidateExtension}`)
    }
    for (const candidateExtension of sourceExtensions) {
      pushUnique(candidates, resolve(withoutExtension, `index${candidateExtension}`))
    }
  } else {
    for (const candidateExtension of sourceExtensions) {
      pushUnique(candidates, `${basePath}${candidateExtension}`)
    }
    for (const candidateExtension of sourceExtensions) {
      pushUnique(candidates, resolve(basePath, `index${candidateExtension}`))
    }
  }

  return candidates.find(existsSync) ?? null
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}

function createPathStubPlugin(
  name: string,
  modules: Record<string, string>,
): Plugin {
  return {
    name,
    setup(buildContext) {
      for (const [modulePath, contents] of Object.entries(modules)) {
        const filter = new RegExp(
          `[\\\\/]src[\\\\/]${modulePath
            .split('/')
            .map(escapeRegex)
            .join('[\\\\/]')}\\.(?:[cm]?[jt]sx?)$`,
        )
        buildContext.onLoad({ filter }, () => ({
          contents,
          loader: 'js',
        }))
      }
    },
  }
}

const localResolutionPlugin: Plugin = {
  name: 'local-resolution',
  setup(buildContext) {
    buildContext.onResolve(
      { filter: /^(src\/|\.\.?(?:\/|\\))/ },
      args => {
        const basePath = args.path.startsWith('src/')
          ? resolve(projectRoot, args.path)
          : resolve(args.resolveDir, args.path)
        const resolvedPath = resolveExistingPath(basePath)
        if (resolvedPath) {
          return { path: resolvedPath }
        }
        if (/\.(md|txt)$/.test(args.path)) {
          return {
            path: basePath,
            namespace: 'text-fallback',
          }
        }
        return {
          path: basePath,
          namespace: 'local-stub',
        }
      },
    )

    buildContext.onLoad(
      { filter: /.*/, namespace: 'text-fallback' },
      () => ({
        contents: `export default '';`,
        loader: 'js',
      }),
    )

    buildContext.onLoad(
      { filter: /.*/, namespace: 'local-stub' },
      args => ({
        contents: `
const unavailable = new Proxy({}, {
  get: () => undefined,
});
module.exports = unavailable;
module.exports.__stubbed = true;
module.exports.__modulePath = ${JSON.stringify(args.path)};
`,
        loader: 'js',
      }),
    )
  },
}

const packageStubPlugin: Plugin = {
  name: 'package-stubs',
  setup(buildContext) {
    const filter = new RegExp(
      `^(?:${Object.keys(packageStubContents).map(escapeRegex).join('|')})$`,
    )

    buildContext.onResolve({ filter }, args => ({
      path: args.path,
      namespace: 'package-stub',
    }))

    buildContext.onLoad(
      { filter: /.*/, namespace: 'package-stub' },
      args => ({
        contents: packageStubContents[args.path],
        loader: 'js',
      }),
    )
  },
}

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

try {
  await build({
    absWorkingDir: projectRoot,
    entryPoints: [resolve(projectRoot, 'src/entrypoints/cli.tsx')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node20'],
    sourcemap: 'external',
    packages: 'external',
    legalComments: 'none',
    jsx: 'automatic',
    tsconfig: resolve(projectRoot, 'tsconfig.json'),
    banner: {
      js: `
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
`,
    },
    loader: {
      '.md': 'text',
      '.txt': 'text',
    },
    define: {
      'MACRO.VERSION': JSON.stringify('99.0.0'),
      'MACRO.DISPLAY_VERSION': JSON.stringify(version),
      'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'MACRO.ISSUES_EXPLAINER': JSON.stringify(
        `report the issue at ${issuesUrl}`,
      ),
      'MACRO.PACKAGE_URL': JSON.stringify(packageUrl),
      'MACRO.NATIVE_PACKAGE_URL': 'undefined',
      'MACRO.FEEDBACK_CHANNEL': JSON.stringify(issuesUrl),
      'MACRO.VERSION_CHANGELOG': 'undefined',
    },
    plugins: [
      localResolutionPlugin,
      createPathStubPlugin('telemetry-stubs', telemetryStubModules),
      createPathStubPlugin('internal-feature-stubs', internalFeatureStubModules),
      packageStubPlugin,
    ],
  })

  console.log(`Built openpro v${version} -> dist/cli.mjs`)
} catch (error) {
  console.error('Build failed.')
  throw error
}
