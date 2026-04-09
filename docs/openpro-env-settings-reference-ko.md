# OpenPro 환경변수 및 설정 키 레퍼런스

## 1. 문서 목적

이 문서는 OpenPro가 설정을 어디에서 읽고, 어떤 우선순위로 합치며, 운영자가 어떤 값을 어디에 넣어야 하는지를 빠르게 판단할 수 있도록 만든 소스 기준 운영 레퍼런스입니다.

분석 기준 파일:

- `src/utils/settings/constants.ts`
- `src/utils/settings/settings.ts`
- `src/utils/settings/types.ts`
- `src/tools/ConfigTool/supportedSettings.ts`
- `src/utils/env.ts`
- `src/utils/envUtils.ts`
- `src/entrypoints/cli.tsx`
- `docs/advanced-setup.md`

## 2. 설정 로딩 구조

### 2.1 우선순위

OpenPro는 여러 설정 소스를 동시에 읽습니다. `src/utils/settings/constants.ts` 기준으로 우선순위는 아래와 같습니다.

| 우선순위 | 소스 | 설명 | 대표 위치 |
|---|---|---|---|
| 1 | `userSettings` | 사용자 전체 공통 설정 | `CLAUDE_CONFIG_DIR` 또는 `~/.claude/settings.json` |
| 2 | `projectSettings` | 저장소에 공유되는 프로젝트 설정 | `<cwd>/.claude/settings.json` |
| 3 | `localSettings` | 개인 전용 프로젝트 설정 | `<cwd>/.claude/settings.local.json` |
| 4 | `flagSettings` | CLI `--settings`로 주입한 설정 | 파일 경로 또는 인라인 JSON |
| 5 | `policySettings` | 관리형 정책 설정 | 원격 관리 설정, OS 정책, `managed-settings.json` 계열 |

중요한 규칙:

- 뒤에 오는 소스가 앞의 소스를 덮어씁니다.
- `policySettings`와 `flagSettings`는 항상 로딩 대상에 포함됩니다.
- `--setting-sources`는 `user`, `project`, `local`만 제어합니다. 정책과 CLI 설정은 제외할 수 없습니다.
- 기업 환경에서는 `policySettings`가 최종 결정권을 갖는 구조로 이해하면 됩니다.

```mermaid
flowchart LR
  A["userSettings"] --> B["projectSettings"]
  B --> C["localSettings"]
  C --> D["flagSettings (--settings)"]
  D --> E["policySettings (managed)"]
  E --> F["최종 유효 설정"]
```

### 2.2 설정 파일 경로

| 구분 | 경로 규칙 | 비고 |
|---|---|---|
| 사용자 설정 | `CLAUDE_CONFIG_DIR/settings.json` 또는 `~/.claude/settings.json` | cowork 모드면 `cowork_settings.json` 사용 |
| 프로젝트 설정 | `<cwd>/.claude/settings.json` | 저장소 공유용 |
| 로컬 설정 | `<cwd>/.claude/settings.local.json` | 일반적으로 gitignore 대상 |
| 관리형 설정 | `managed-settings.json` 및 drop-in, 원격 정책 | `src/utils/settings/settings.ts`에서 여러 정책 소스를 병합 |
| 글로벌 런타임 config | `${CLAUDE_CONFIG_DIR 또는 홈 디렉터리}/.claude*.json` | UI/상태, 일부 개인 설정 저장 |

주의할 점:

- `CLAUDE_CONFIG_DIR`는 `settings.json`, `CLAUDE.md`, 메모리 디렉터리 등 설정 홈 계열 경로에 영향을 줍니다.
- 글로벌 런타임 config 파일은 `~/.claude/` 아래가 아니라 홈 디렉터리 직하위 `.claude*.json` 형식일 수 있습니다.
- 구 버전 호환 때문에 `~/.claude/.config.json`도 fallback 대상으로 남아 있습니다.
- 관리형 정책 내부 우선순위는 대체로 `remote > OS 정책 plist/HKLM > managed-settings.json 계열 > HKCU` 순서로 해석하면 됩니다.

## 3. 어떤 값을 어디에 둘 것인가

| 저장 위치 | 적합한 용도 | 권장 사례 |
|---|---|---|
| 환경변수 | 인증, CI, 일회성 실행, 런타임 강제 오버라이드 | `OPENAI_API_KEY`, `CLAUDE_CODE_USE_OPENAI` |
| `userSettings` | 개인 공통 선호도 | 언어, 모델 기본값, 권한 기본 모드 |
| `projectSettings` | 팀 공통 정책과 워크플로 | MCP 허용, 훅, 팀 공통 plugin source |
| `localSettings` | 개인 프로젝트 보정값 | 개인 추가 디렉터리, 임시 실험 설정 |
| `policySettings` | 기업 정책 강제 | 허용 모델, 허용 MCP 서버, bypass 비활성화 |
| 글로벌 config | UI/상태 중심 값 | 테마, 알림 채널, 프로젝트별 상태 |

운영 원칙:

- 비밀키는 가능하면 환경변수 또는 secure storage에 두고, 프로젝트 설정 파일에는 넣지 않습니다.
- 팀 전체에 공통으로 필요한 동작은 `projectSettings`에 두고, 개인 편의 설정은 `userSettings` 또는 `localSettings`로 분리합니다.
- 강제 차단 정책은 `policySettings`에서 처리합니다.

## 4. `/config`에서 직접 다루는 핵심 설정

아래 키는 `src/tools/ConfigTool/supportedSettings.ts` 기준으로 사용자가 즉시 조정하기 쉬운 대표 설정입니다.

| 키 | 저장 성격 | 타입 | 의미 |
|---|---|---|---|
| `theme` | global | string | UI 테마 |
| `editorMode` | global | string | 키 바인딩 모드 |
| `verbose` | global | boolean | 디버그 출력 강화 |
| `preferredNotifChannel` | global | string | 선호 알림 채널 |
| `autoCompactEnabled` | global | boolean | 컨텍스트 한계 도달 시 자동 compact |
| `autoMemoryEnabled` | settings | boolean | auto-memory 활성화 |
| `autoDreamEnabled` | settings | boolean | 백그라운드 memory consolidation 활성화 |
| `fileCheckpointingEnabled` | global | boolean | 코드 rewind용 체크포인트 |
| `showTurnDuration` | global | boolean | 응답 후 소요 시간 표시 |
| `terminalProgressBarEnabled` | global | boolean | 지원 터미널에서 진행 표시 |
| `todoFeatureEnabled` | global | boolean | todo/task 추적 기능 활성화 |
| `model` | settings | string | 기본 모델 오버라이드 |
| `alwaysThinkingEnabled` | settings | boolean | thinking 사용 기본값 |
| `permissions.defaultMode` | settings | string | 기본 권한 모드 |
| `language` | settings | string | 응답 및 dictation 기본 언어 |
| `teammateMode` | global | string | teammate 실행 백엔드 선택 |
| `voiceEnabled` | settings | boolean | 음성 dictation 활성화, feature gate 필요 |
| `remoteControlAtStartup` | global | boolean | 시작 시 remote control 활성화, feature gate 필요 |
| `taskCompleteNotifEnabled` | global | boolean | 작업 완료 모바일 알림 |
| `inputNeededNotifEnabled` | global | boolean | 입력 필요 알림 |
| `agentPushNotifEnabled` | global | boolean | 에이전트 판단 기반 푸시 알림 |

해석 팁:

- `global`은 주로 글로벌 config를 통해 즉시 반영되는 성격입니다.
- `settings`는 `settings.json` 계열을 타고 들어가는 지속 설정입니다.
- feature gate가 꺼진 빌드에서는 일부 키가 문서에만 있고 실제 UI에는 노출되지 않을 수 있습니다.

## 5. `settings.json` 주요 상위 키

`src/utils/settings/types.ts` 기준으로 운영에서 자주 다루는 핵심 상위 키를 정리하면 아래와 같습니다.

| 키 | 목적 | 운영 관점 설명 |
|---|---|---|
| `$schema` | JSON schema 연결 | IDE 자동완성과 검증 지원 |
| `apiKeyHelper` | 인증 값 반환 스크립트 | 직접 키를 파일에 넣기 어려운 환경에 적합 |
| `awsCredentialExport` | AWS 자격증명 export 스크립트 | Bedrock 계열 보조 |
| `awsAuthRefresh` | AWS 인증 갱신 | 만료형 인증 갱신 자동화 |
| `gcpAuthRefresh` | GCP 인증 갱신 | Vertex/GCP 계열 보조 |
| `env` | 세션 환경변수 주입 | 세션 프로세스에 넣을 환경값 |
| `permissions` | 권한 정책 | allow, deny, ask, defaultMode, 추가 디렉터리 |
| `model` | 기본 모델 지정 | 세션 기본 모델 오버라이드 |
| `availableModels` | 모델 allowlist | 관리형 환경에서 유용 |
| `modelOverrides` | 모델명 치환 | Anthropic ID를 provider 전용 ID로 매핑 |
| `hooks` | 전후처리 훅 | 명령, 프롬프트, HTTP, agent hook |
| `enabledMcpjsonServers` | 승인된 `.mcp.json` 서버 | 프로젝트 MCP 승인 상태 |
| `disabledMcpjsonServers` | 거부된 `.mcp.json` 서버 | 사용자 거부 상태 |
| `allowedMcpServers` | MCP allowlist | 기업 보안 정책 핵심 |
| `deniedMcpServers` | MCP denylist | allowlist보다 우선 적용 |
| `allowManagedHooksOnly` | 관리형 훅만 허용 | 사용자/프로젝트 훅 차단 |
| `allowManagedPermissionRulesOnly` | 관리형 권한 규칙만 허용 | 로컬 allow/deny 무시 |
| `allowManagedMcpServersOnly` | 관리형 MCP allowlist만 사용 | 개인 allowlist 확장 제한 |
| `strictPluginOnlyCustomization` | 비플러그인 커스터마이징 차단 | 기업 통제 강화 |
| `enabledPlugins` | 활성 플러그인 | `plugin@marketplace` 키 기반 |
| `extraKnownMarketplaces` | 추가 마켓플레이스 등록 | 팀 공통 플러그인 소스 |
| `strictKnownMarketplaces` | 허용된 marketplace source만 허용 | 다운로드 전 차단 |
| `blockedMarketplaces` | 금지 marketplace source | 다운로드 전 차단 |
| `language` | 기본 언어 | 한국어/일본어 등 선호 언어 |
| `outputStyle` | 출력 스타일 | 응답 표현 스타일 조정 |
| `sandbox` | 샌드박스 설정 | 실행 격리 정책 |
| `pluginConfigs` | 플러그인 사용자 설정 | 옵션과 MCP server userConfig 저장 |
| `remote.defaultEnvironmentId` | 원격 세션 기본 환경 | remote 기능 사용 시 의미 있음 |
| `plansDirectory` | plan 파일 디렉터리 | 기본은 `~/.claude/plans/` |

## 6. 핵심 환경변수

아래 표는 운영과 개발에서 직접 다루는 빈도가 높은 환경변수만 추린 것입니다. 소스 전체에는 실험, 내부 디버그, 테스트 전용 키가 더 많이 존재합니다.

### 6.1 Provider 및 인증

| 환경변수 | 목적 | 비고 |
|---|---|---|
| `CLAUDE_CODE_USE_OPENAI` | OpenAI 호환 provider 경로 사용 | `OPENAI_API_KEY` 조합이 일반적 |
| `OPENAI_API_KEY` | OpenAI 호환 인증 키 | `OPENAI_BASE_URL`이 로컬이 아니면 사실상 필수 |
| `OPENAI_BASE_URL` | OpenAI 호환 base URL | OpenAI, OpenRouter, LM Studio, Ollama 호환 서버 |
| `OPENAI_MODEL` | OpenAI 계열 모델명 | provider별 model ID 직접 지정 |
| `CLAUDE_CODE_USE_GEMINI` | Gemini provider 경로 사용 | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` 필요 |
| `GEMINI_API_KEY` | Gemini 전용 키 | |
| `GOOGLE_API_KEY` | Google API 키 | Gemini 대체 입력으로 허용 |
| `GEMINI_BASE_URL` | Gemini API base URL | 프록시 또는 대체 엔드포인트 |
| `GEMINI_MODEL` | Gemini 모델명 | |
| `CLAUDE_CODE_USE_GITHUB` | GitHub Models 경로 사용 | `GITHUB_TOKEN` 또는 `GH_TOKEN` 필요 |
| `GITHUB_TOKEN` | GitHub 토큰 | |
| `GH_TOKEN` | GitHub CLI 계열 토큰 | `GITHUB_TOKEN` 대체 |
| `CODEX_API_KEY` | Codex API 키 | Codex transport 사용 시 핵심 |
| `CODEX_AUTH_JSON_PATH` | Codex auth.json 경로 | 저장된 Codex 자격 재사용 |
| `CODEX_HOME` | Codex 홈 경로 | Codex 관련 파일 탐색 기준 |
| `CODEX_ACCOUNT_ID` | Codex 계정 식별자 | 일부 transport에서 필요 |
| `CHATGPT_ACCOUNT_ID` | ChatGPT 계정 식별자 | Codex 연계 경로 보조 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 | 1st-party 경로 |
| `ANTHROPIC_AUTH_TOKEN` | Anthropic 토큰 | OAuth/대체 인증 흐름 |
| `ANTHROPIC_BASE_URL` | Anthropic base URL | |
| `NODE_EXTRA_CA_CERTS` | 추가 CA 인증서 | 사내 프록시/TLS 환경 대응 |

### 6.2 실행 동작 및 UX

| 환경변수 | 목적 | 비고 |
|---|---|---|
| `CLAUDE_CODE_SIMPLE` | 단순 모드 | hooks, plugin sync, keychain, auto-memory 등 축소 |
| `CLAUDE_CODE_DISABLE_THINKING` | thinking 비활성화 | 모델 자동 thinking 경로 차단 |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | auto-memory 비활성화 | 장기 메모리 저장 차단 |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | 백그라운드 작업 차단 | memory consolidation 등 억제 |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY` | 프롬프트 히스토리 생략 | headless/민감 환경에서 유용 |
| `CLAUDE_CODE_AUTO_CONNECT_IDE` | IDE 자동 연결 | 단일 유효 IDE일 때 연결 |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` | prompt suggestion 활성화 | |
| `CLAUDE_CODE_USE_CCR_V2` | CCR v2 경로 사용 | remote/session ingress 계열 |
| `CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2` | session ingress POST 경로 제어 | |
| `CLAUDE_CODE_SESSION_ACCESS_TOKEN` | 세션 접근 토큰 | 원격/중계 계열 |
| `CLAUDE_CODE_WORKER_EPOCH` | 워커 세대 식별 | 백그라운드/프로세스 관리 |
| `CLAUDE_CODE_TMPDIR` | 임시 디렉터리 강제 | 기본 temp 경로 대신 사용 |
| `OPENPRO_ENABLE_EARLY_INPUT` | early input 캡처 | 시작 직후 입력 수집 최적화 |
| `OPENPRO_PROFILE_GOAL` | 프로파일링 목표값 | 성능 진단 보조 |

### 6.3 원격, bridge, session ingress

| 환경변수 | 목적 | 비고 |
|---|---|---|
| `CLAUDE_CODE_REMOTE` | remote 환경 표시 | 권한 모드 일부 제한과 연결 |
| `CLAUDE_BRIDGE_SESSION_INGRESS_URL` | bridge session ingress URL | remote-control/bridge 경로 |
| `CLAUDE_BRIDGE_USE_CCR_V2` | bridge용 CCR v2 토글 | |
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth access token | |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` | OAuth refresh token | |
| `CLAUDE_CODE_OAUTH_SCOPES` | OAuth scope | |
| `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR` | OAuth 토큰 FD 전달 | wrapper/launcher용 |
| `CLAUDE_TRUSTED_DEVICE_TOKEN` | trusted device 토큰 | |
| `CLAUDE_CODE_REMOTE_SESSION_ID` | 원격 세션 ID | remote 실행 보조 |
| `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE` | 원격 환경 타입 | |
| `CLAUDE_CODE_REMOTE_MEMORY_DIR` | remote memory 디렉터리 | 원격 메모리 위치 보정 |

### 6.4 플러그인, MCP, 확장

| 환경변수 | 목적 | 비고 |
|---|---|---|
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL` | 플러그인 설치 동기화 실행 | startup 시 plugin sync 동작 제어 |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS` | 플러그인 sync 타임아웃 | |
| `CLAUDE_CODE_PLUGIN_CACHE_DIR` | 플러그인 캐시 경로 | |
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` | 플러그인 git timeout | |
| `MCP_TIMEOUT` | MCP 기본 timeout | |
| `MCP_TOOL_TIMEOUT` | MCP tool timeout | |
| `MCP_CLIENT_SECRET` | MCP OAuth client secret | `mcp add-json` 계열에서 활용 |
| `ENABLE_MCP_LARGE_OUTPUT_FILES` | MCP 대용량 출력 파일 경로 | |

### 6.5 진단과 디버깅

| 환경변수 | 목적 | 비고 |
|---|---|---|
| `CLAUDE_CODE_DEBUG_LOG_LEVEL` | 디버그 로그 레벨 | |
| `CLAUDE_CODE_DEBUG_LOGS_DIR` | 디버그 로그 저장 디렉터리 | |
| `CLAUDE_CODE_DIAGNOSTICS_FILE` | 진단 결과 출력 파일 | |
| `CLAUDE_CODE_JSONL_TRANSCRIPT` | JSONL transcript 출력 | |
| `CLAUDE_CODE_SESSION_LOG` | 세션 로그 파일 | |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | telemetry 활성화 | |
| `DISABLE_TELEMETRY` | telemetry 비활성화 | |
| `API_TIMEOUT_MS` | API timeout | provider 공통 진단에 유용 |
| `CLAUDE_STREAM_IDLE_TIMEOUT_MS` | 스트림 idle timeout | |
| `SSL_CERT_FILE` | SSL 인증서 파일 | 프록시/사설 CA 대응 |

## 7. 운영 예시

### 7.1 팀 공통 `projectSettings`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "sonnet",
  "language": "korean",
  "permissions": {
    "defaultMode": "plan",
    "additionalDirectories": ["../shared-docs"]
  },
  "hooks": {
    "PreToolUse": []
  },
  "enabledMcpjsonServers": ["docs", "issue-tracker"]
}
```

### 7.2 개인 전용 `localSettings`

```json
{
  "permissions": {
    "additionalDirectories": ["D:/sandbox/personal-notes"]
  },
  "env": {
    "DEBUG": "1"
  }
}
```

### 7.3 CI 또는 일회성 실행

```powershell
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-4o"

openpro -p "현재 저장소 상태를 요약해줘"
```

## 8. 운영 체크리스트

- 인증 관련 값은 `projectSettings`보다 환경변수 또는 secure storage를 우선 사용합니다.
- 팀 공유 규칙은 `settings.local.json`이 아니라 `settings.json`에 둡니다.
- 예상과 다른 값이 적용되면 `policySettings`와 `--settings`가 덮어썼는지 먼저 확인합니다.
- cowork 모드에서는 사용자 설정 파일명이 `cowork_settings.json`으로 바뀔 수 있습니다.
- `CLAUDE_CONFIG_DIR`를 바꾸면 설정, 메모리, rules 탐색 위치가 함께 바뀌므로 운영 문서에도 같이 기록합니다.
- 원격 환경에서는 권한 모드와 자격증명 우선순위가 로컬과 다를 수 있으므로 [openpro-auth-credential-guide-ko.md](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md), [openpro-server-mode-guide-ko.md](D:/project/openpro/docs/openpro-server-mode-guide-ko.md)를 함께 봅니다.
