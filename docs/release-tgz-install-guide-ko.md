# OpenPro Release TGZ Install Guide

This guide explains how to publish and install OpenPro from a GitHub Release tarball asset instead of installing from npm.

## 1. Build and pack the release artifact

From the repository root:

```powershell
bun run build
npm pack
```

This creates a file like:

```text
hkjang-openpro-0.1.10.tgz
```

Upload that `.tgz` file to the matching GitHub Release.

## 2. Install from the release asset

After downloading the release asset to your machine:

Windows PowerShell:

```powershell
npm install -g .\hkjang-openpro-0.1.10.tgz
openpro --version
```

macOS / Linux:

```bash
npm install -g ./hkjang-openpro-0.1.10.tgz
openpro --version
```

## 3. Upgrade to a newer release tarball

Download the newer `.tgz` file and run the same command again:

Windows PowerShell:

```powershell
npm install -g .\hkjang-openpro-0.1.10.tgz
```

macOS / Linux:

```bash
npm install -g ./hkjang-openpro-0.1.10.tgz
```

`npm install -g` will replace the previous global OpenPro installation with the downloaded release build.

## 4. Recommended release checklist

- Run `bun test src/components/messages/UserPromptMessage.test.ts`
- Run `bun run build`
- Run `npm pack`
- Verify `node .\dist\cli.mjs --version` or `node ./dist/cli.mjs --version`
- Verify `openpro --version` after global install
