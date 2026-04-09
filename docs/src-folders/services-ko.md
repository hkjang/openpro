# `src/services` 폴더 문서

## 역할

`src/services`는 OpenPro의 도메인 서비스 계층입니다.  
모델 API 호출, compact, MCP, analytics, session memory, plugin install, LSP, prompt suggestion 같은 실제 비즈니스 로직이 이 폴더에 모입니다.

하위 폴더 단위 세부 문서는 [index-ko.md](D:/project/openpro/docs/src-subfolders/services/index-ko.md)에서 확인할 수 있습니다.

## 핵심 특징

- `query.ts`가 직접 호출하는 로직이 많습니다.
- UI와 무관한 도메인 규칙은 우선 이 폴더에 놓이는 경우가 많습니다.
- `utils`가 범용 인프라라면, `services`는 기능 중심의 응용 서비스 계층입니다.

## 대표 하위 폴더

| 폴더 | 대표 파일 | 역할 |
|---|---|---|
| `analytics` | `growthbook.ts`, `firstPartyEventLogger.ts` | feature gate, 이벤트 로깅 |
| `api` | `client.ts`, `claude.ts`, `bootstrap.ts` | 모델 API와 bootstrap 통신 |
| `compact` | `compact.ts`, `autoCompact.ts`, `cachedMicrocompact.ts` | 컨텍스트 압축 |
| `SessionMemory` | `sessionMemory.ts`, `sessionMemoryUtils.ts` | 세션 요약 메모리 |
| `mcp` | `auth.ts`, `claudeai.ts`, `channelPermissions.ts` | MCP 연결과 정책 |
| `plugins` | `PluginInstallationManager.ts` | 플러그인 설치/조작 |
| `lsp` | `LSPServerManager.ts`, `LSPClient.ts` | LSP 런타임 |
| `PromptSuggestion` | `promptSuggestion.ts`, `speculation.ts` | prompt suggestion |
| `remoteManagedSettings` | `index.ts`, `syncCache.ts` | 원격 관리 설정 |
| `autoDream` | `autoDream.ts`, `consolidationPrompt.ts` | background consolidation |
| `toolUseSummary` | `toolUseSummaryGenerator.ts` | tool 사용 요약 |

## 읽는 순서

1. 관심 기능의 서비스 폴더
2. 해당 서비스와 연결된 `query.ts` 또는 command/tool 호출부
3. 그다음 `utils` 보조 파일

## 변경 시 체크포인트

- 이 폴더는 기능 변경의 실제 구현 중심이라 테스트 범위를 넓게 봐야 합니다.
- domain rule을 `utils`로 내리기 전에 재사용성과 책임 경계를 검토하는 편이 좋습니다.
