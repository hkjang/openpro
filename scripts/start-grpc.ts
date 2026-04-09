import { GrpcServer } from '../src/grpc/server.ts'
import { init } from '../src/entrypoints/init.ts'

// Polyfill MACRO which is normally injected by the bundler
Object.assign(globalThis, {
  MACRO: {
    VERSION: '0.1.9',
    DISPLAY_VERSION: '0.1.9',
    PACKAGE_URL: '@hkjang/openpro',
  }
})

async function main() {
  console.log('Starting OpenPro gRPC Server...')
  await init()

  // Mirror the CLI bootstrap order so provider profiles and stored tokens apply.
  const { enableConfigs } = await import('../src/utils/config.js')
  enableConfigs()
  const { applySafeConfigEnvironmentVariables } = await import('../src/utils/managedEnv.js')
  applySafeConfigEnvironmentVariables()
  const { buildStartupEnvFromProfile, applyProfileEnvToProcessEnv } = await import('../src/utils/providerProfile.js')
  const { getProviderValidationError, validateProviderEnvOrExit } = await import('../src/utils/providerValidation.js')
  const startupEnv = await buildStartupEnvFromProfile({ processEnv: process.env })
  if (startupEnv !== process.env) {
    const startupProfileError = getProviderValidationError(startupEnv)
    if (startupProfileError) {
      console.warn(`Warning: ignoring saved provider profile. ${startupProfileError}`)
    } else {
      applyProfileEnvToProcessEnv(process.env, startupEnv)
    }
  }

  const {
    hydrateGithubModelsTokenFromSecureStorage,
    refreshGithubModelsTokenIfNeeded,
  } = await import('../src/utils/githubModelsCredentials.js')
  await refreshGithubModelsTokenIfNeeded()
  hydrateGithubModelsTokenFromSecureStorage()

  validateProviderEnvOrExit()

  const port = process.env.GRPC_PORT ? parseInt(process.env.GRPC_PORT, 10) : 50051
  const host = process.env.GRPC_HOST || 'localhost'
  const server = new GrpcServer()

  server.start(port, host)
}

main().catch(err => {
  console.error('Fatal error starting gRPC server:', err)
  process.exit(1)
})
