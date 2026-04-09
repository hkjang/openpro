# OpenPro

OpenPro is an open-source coding-agent CLI that works with more than one model provider.

Use OpenAI-compatible APIs, Gemini, GitHub Models, Codex, Ollama, Atomic Chat, and other supported backends while keeping the same terminal-first workflow: prompts, tools, agents, MCP, slash commands, and streaming output.

## Why OpenPro

- Use one CLI across cloud and local model providers
- Save provider profiles inside the app with `/provider`
- Run locally with Ollama or Atomic Chat
- Keep core coding-agent workflows: bash, file tools, grep, glob, agents, tasks, MCP, and web tools

---

## Quick Start

### Install

```bash
npm install -g @hkjang/openpro
```

### Install from a GitHub release `.tgz`

Release assets are built with `bun run pack:release`, which bundles the runtime npm dependencies into the tarball so `npm install -g` can install from the local file without reaching the npm registry during install.

If you downloaded a release asset such as `hkjang-openpro-x.y.z.tgz`, install it globally with:

macOS / Linux:

```bash
npm install -g ./hkjang-openpro-x.y.z.tgz
```

Windows PowerShell:

```powershell
npm install -g .\hkjang-openpro-x.y.z.tgz
```

After installation, confirm the installed build:

```bash
openpro --version
```

If the npm install path later reports `ripgrep not found`, install ripgrep system-wide and confirm `rg --version` works in the same terminal before starting OpenPro.

### Start

```bash
openpro
```

Inside OpenPro:

- run `/provider` for guided setup of OpenAI-compatible, Gemini, Ollama, or Codex profiles
- run `/onboard-github` for GitHub Models setup

### Fastest OpenAI setup

macOS / Linux:

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o

openpro
```

Windows PowerShell:

```powershell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-your-key-here"
$env:OPENAI_MODEL="gpt-4o"

openpro
```

### Fastest local Ollama setup

macOS / Linux:

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=qwen2.5-coder:7b

openpro
```

Windows PowerShell:

```powershell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_BASE_URL="http://localhost:11434/v1"
$env:OPENAI_MODEL="qwen2.5-coder:7b"

openpro
```

---

## Setup Guides

Beginner-friendly guides:

- [Non-Technical Setup](docs/non-technical-setup.md)
- [Windows Quick Start](docs/quick-start-windows.md)
- [macOS / Linux Quick Start](docs/quick-start-mac-linux.md)

Korean documentation set:

- [Korean Docs Index](docs/openpro-docs-index-ko.md)
- [Korean Overview](docs/openpro-overview-ko.md)
- [Korean Functional Spec](docs/openpro-functional-spec-ko.md)
- [Korean `src` Folder Code Reference](docs/openpro-src-folder-reference-ko.md)
- [Korean `src` Folder Docs Index](docs/src-folders/index-ko.md)
- [Korean `commands/services/tools/utils` Subfolder Docs Index](docs/src-subfolders/index-ko.md)
- [Korean API Guide](docs/openpro-api-guide-ko.md)
- [Korean Provider Matrix](docs/openpro-provider-matrix-ko.md)
- [Korean Request Lifecycle Guide](docs/openpro-request-lifecycle-guide-ko.md)
- [Korean Session and Transcript Storage Guide](docs/openpro-session-transcript-storage-guide-ko.md)
- [Korean Change Impact Map](docs/openpro-change-impact-map-ko.md)
- [Korean Server Mode Guide](docs/openpro-server-mode-guide-ko.md)
- [Korean Feature Flag and Build Guide](docs/openpro-feature-flag-build-guide-ko.md)
- [Korean Release, Packaging, and Fork Maintenance Guide](docs/openpro-release-packaging-fork-guide-ko.md)
- [Korean Release TGZ Install Guide](docs/release-tgz-install-guide-ko.md)
- [Korean Remote Control and Bridge Guide](docs/openpro-remote-control-bridge-guide-ko.md)
- [Korean Auth and Credential Guide](docs/openpro-auth-credential-guide-ko.md)
- [Korean Environment and Settings Reference](docs/openpro-env-settings-reference-ko.md)
- [Korean Command Cookbook](docs/openpro-command-cookbook-ko.md)
- [Korean Permission and Security Matrix](docs/openpro-permission-security-matrix-ko.md)
- [Korean Error Catalog](docs/openpro-error-catalog-ko.md)
- [Korean Troubleshooting Guide](docs/openpro-troubleshooting-guide-ko.md)
- [Korean MCP Operations Guide](docs/openpro-mcp-operations-guide-ko.md)
- [Korean Plugin and Hook Guide](docs/openpro-plugin-hook-guide-ko.md)
- [Korean Memory and Context Compaction Spec](docs/openpro-memory-context-compaction-ko.md)
- [Korean Coding Agent Architecture Spec](docs/coding-agent-architecture-spec-ko.md)
- [Korean Coding Agent Flow and Security Spec](docs/coding-agent-flow-security-spec-ko.md)

Advanced and source-build guides:

- [Advanced Setup](docs/advanced-setup.md)
- [Android Install](ANDROID_INSTALL.md)

---

## Supported Providers

| Provider | Setup Path | Notes |
| --- | --- | --- |
| OpenAI-compatible | `/provider` or env vars | Works with OpenAI, OpenRouter, DeepSeek, Groq, Mistral, LM Studio, and compatible local `/v1` servers |
| Gemini | `/provider` or env vars | Google Gemini support through the runtime provider layer |
| GitHub Models | `/onboard-github` | Interactive onboarding with saved credentials |
| Codex | `/provider` | Uses existing Codex credentials when available |
| Ollama | `/provider` or env vars | Local inference with no API key |
| Atomic Chat | advanced setup | Local Apple Silicon backend |
| Bedrock / Vertex / Foundry | env vars | Additional provider integrations for supported environments |

---

## What Works

- Tool-driven coding workflows
  Bash, file read/write/edit, grep, glob, agents, tasks, MCP, and slash commands
- Streaming responses
  Real-time token output and tool progress
- Tool calling
  Multi-step tool loops with model calls, tool execution, and follow-up responses
- Images
  URL and base64 image inputs for providers that support vision
- Provider profiles
  Guided setup plus saved `.openpro-profile.json` support
- Local and remote model backends
  Cloud APIs, local servers, and Apple Silicon local inference

---

## Provider Notes

OpenPro supports multiple providers, but behavior is not identical across all of them.

- Anthropic-specific features may not exist on other providers
- Tool quality depends heavily on the selected model
- Smaller local models can struggle with long multi-step tool flows
- Some providers impose lower output caps than the CLI defaults, and OpenPro adapts where possible

For best results, use models with strong tool/function calling support.

---

## Web Search and Fetch

`WebFetch` works out of the box.

`WebSearch` and richer JS-aware fetching work best with a Firecrawl API key:

```bash
export FIRECRAWL_API_KEY=your-key-here
```

With Firecrawl enabled:

- `WebSearch` is available across more provider setups
- `WebFetch` can handle JavaScript-rendered pages more reliably

Firecrawl is optional. Without it, OpenPro falls back to the built-in behavior.

---

## Source Build

```bash
bun install
bun run build
node dist/cli.mjs
```

Helpful commands:

- `bun run dev`
- `bun run smoke`
- `bun run doctor:runtime`

---

## VS Code Extension

The repo includes a VS Code extension in [`vscode-extension/openpro-vscode`](vscode-extension/openpro-vscode) for OpenPro launch integration and theme support.

---

## Security

If you believe you found a security issue, see [SECURITY.md](SECURITY.md).

---

## Contributing

Contributions are welcome.

For larger changes, open an issue first so the scope is clear before implementation. Helpful validation commands include:

- `bun run build`
- `bun run smoke`
- focused `bun test ...` runs for touched areas

---

## Disclaimer

OpenPro is an independent community project and is not affiliated with, endorsed by, or sponsored by Anthropic.

"Claude" and "Claude Code" are trademarks of Anthropic.

---

## License

MIT
