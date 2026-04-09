export function shouldUsePlainUserPromptLayout(useBriefLayout: boolean, platform = process.platform): boolean {
  return useBriefLayout || platform === 'win32'
}
