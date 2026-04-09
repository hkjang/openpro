/**
 * Upstream uses this hook to steer npm users toward Anthropic's native
 * installer. OpenPro is still distributed through npm tarballs, so the
 * upstream deprecation warning is both noisy and incorrect here.
 */
export function useNpmDeprecationNotification(): void {}
