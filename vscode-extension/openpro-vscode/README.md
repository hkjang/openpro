# OpenPro VS Code Extension

A sleek VS Code companion for OpenPro with a visual **Control Center** plus terminal-first workflows.

## Features

- **Control Center sidebar UI** in the Activity Bar:
  - Launch OpenPro
  - Open repository/docs
  - Open VS Code theme picker
- **Terminal launch command**: `OpenPro: Launch in Terminal`
- **Built-in dark theme**: `OpenPro Terminal Black` (terminal-inspired, low-glare, neon accents)

## Requirements

- VS Code `1.95+`
- `openpro` available in your terminal PATH (`npm install -g @hkjang/openpro`)

## Commands

- `OpenPro: Open Control Center`
- `OpenPro: Launch in Terminal`
- `OpenPro: Open Repository`

## Settings

- `openpro.launchCommand` (default: `openpro`)
- `openpro.terminalName` (default: `OpenPro`)
- `openpro.useOpenAIShim` (default: `true`)

## Development

From this folder:

```bash
npm run lint
```

To package (optional):

```bash
npm run package
```

