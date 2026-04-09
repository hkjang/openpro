# OpenPro 오류 메시지 카탈로그

## 1. 문서 목적

이 문서는 OpenPro에서 실제로 사용자 또는 운영자가 마주치는 대표 오류 메시지를 코드 기준으로 분류한 카탈로그다.  
목표는 “메시지 한 줄을 보고도 어디를 먼저 확인해야 하는지”를 빠르게 판단할 수 있게 만드는 것이다.

이 문서는 다음 상황에 특히 유용하다.

- 기동 직후 provider 검증에서 실패할 때
- 로그인, API key, OAuth, Codex 인증이 꼬였을 때
- SSL, 프록시, 네트워크, 모델 접근 권한 문제를 분리해야 할 때
- MCP, plugin, update, session resume 문제를 1차 분류해야 할 때

관련 문서:

- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)
- [인증 / 자격증명 가이드](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md)
- [API 가이드](D:/project/openpro/docs/openpro-api-guide-ko.md)
- [서버 모드 가이드](D:/project/openpro/docs/openpro-server-mode-guide-ko.md)

---

## 2. 빠른 사용법

오류가 발생하면 아래 순서로 본다.

1. 메시지가 “기동 직후” 나왔는지, “모델 호출 중” 나왔는지 먼저 구분한다.
2. provider 검증, 인증, 네트워크, 모델 접근, MCP, plugin, update 중 어느 범주인지 찾는다.
3. 이 문서의 대표 메시지와 같은지 확인한다.
4. 원인 후보와 1차 대응을 본다.
5. 그래도 애매하면 마지막 열의 소스 파일을 열어 분기 조건을 본다.

---

## 3. 자주 확인하는 핵심 파일

| 파일 | 주로 담당하는 오류 범주 |
|---|---|
| `src/entrypoints/cli.tsx` | 기동 시 provider / env 검증 |
| `src/cli/handlers/auth.ts` | 로그인, OAuth, API key 생성 |
| `src/services/api/errorUtils.ts` | 네트워크 / SSL / 연결 오류 문구 |
| `src/services/api/errors.ts` | 모델 접근, 인증 실패, API 에러 분류 |
| `src/commands/resume/resume.tsx` | resume 관련 오류 |
| `src/commands/voice/voice.ts` | voice mode 계정 요구 |
| `src/utils/teleport.tsx`, `src/utils/teleport/api.ts` | web session / teleport 인증 |
| `src/cli/handlers/mcp.tsx` | MCP CLI 오류 |
| `src/services/mcp/config.ts` | MCP 설정 파일 해석 오류 |
| `src/cli/handlers/plugins.ts` | plugin 설치/검증/로드 오류 |
| `src/cli/update.ts` | 업데이트 오류 |

---

## 4. 기동 직후 provider / 환경 검증 오류

| 대표 메시지 | 발생 시점 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `GEMINI_API_KEY is required when CLAUDE_CODE_USE_GEMINI=1.` | 시작 직후 | Gemini 모드인데 API key 누락 | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` 설정 | `src/entrypoints/cli.tsx` |
| `GITHUB_TOKEN or GH_TOKEN is required when CLAUDE_CODE_USE_GITHUB=1.` | 시작 직후 | GitHub Models 모드인데 토큰 누락 | `GITHUB_TOKEN` 또는 `GH_TOKEN` 설정 | `src/entrypoints/cli.tsx` |
| `Invalid OPENAI_API_KEY: placeholder value SUA_CHAVE detected...` | 시작 직후 | 예시 placeholder 값을 그대로 사용 | 실제 key 로 교체하거나 로컬 provider 면 제거 | `src/entrypoints/cli.tsx` |
| `Codex auth is required ...` | 시작 직후 | Codex 모델을 쓰는데 `CODEX_API_KEY` 또는 auth.json 없음 | Codex 로그인 또는 env 설정 | `src/entrypoints/cli.tsx` |
| `Codex auth is missing chatgpt_account_id...` | 시작 직후 | Codex auth.json 은 있으나 account id 누락 | 재로그인 또는 `CHATGPT_ACCOUNT_ID` 설정 | `src/entrypoints/cli.tsx` |
| `OPENAI_API_KEY is required when CLAUDE_CODE_USE_OPENAI=1 and OPENAI_BASE_URL is not local.` | 시작 직후 | OpenAI-compatible 원격 endpoint 에 key 없이 연결 | `OPENAI_API_KEY` 추가 또는 base URL 을 로컬 endpoint 로 수정 | `src/entrypoints/cli.tsx` |
| `Warning: ignoring saved provider profile. ...` | 시작 직후 경고 | 저장된 provider profile 이 현재 환경과 맞지 않음 | 저장된 profile 내용과 현재 env 를 비교 | `src/entrypoints/cli.tsx` |

운영 팁:

- “아직 모델 호출도 안 했는데 죽는다”면 이 범주부터 본다.
- 이 단계의 오류는 대부분 네트워크 문제가 아니라 초기 입력 검증 문제다.

---

## 5. 로그인 / 인증 / OAuth 오류

| 대표 메시지 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `Unable to create API key. The server accepted the request but did not return a key.` | 키 생성 응답이 비정상 | 서버 응답 형식 문제 또는 backend 이상 | 재시도 후 auth handler 와 응답 payload 확인 | `src/cli/handlers/auth.ts` |
| `Error: --console and --claudeai cannot be used together.` | 상호 배타 옵션 충돌 | 로그인 옵션 사용법 오류 | 둘 중 하나만 사용 | `src/cli/handlers/auth.ts` |
| `CLAUDE_CODE_OAUTH_SCOPES is required when using CLAUDE_CODE_OAUTH_REFRESH_TOKEN...` | refresh token 기반 OAuth 설정 부족 | scope env 누락 | scope env 함께 설정 | `src/cli/handlers/auth.ts` |
| `Login failed: ...` | 로그인 전체 실패 | 브라우저 인증 실패, 프록시, SSL, 응답 오류 | 상세 suffix 와 SSL 힌트 확인 | `src/cli/handlers/auth.ts` |
| `Please run /login · API Error: ...` | 대화형 모드 인증 실패 | 세션 만료, 토큰 무효, 로그인 누락 | `/login` 재실행 | `src/services/api/errors.ts` |
| `Failed to authenticate. API Error: ...` | 비대화형 인증 실패 | CI/headless 환경 토큰 무효 | 토큰 재설정 후 재실행 | `src/services/api/errors.ts` |
| `Not logged in · Please run /login` | 인증 정보 없음 | auth.json 부재, 로그아웃 상태 | `/login` 수행 | `src/services/api/errors.ts` |
| `OAuth token revoked · Please run /login` | 기존 OAuth 토큰 폐기 | 계정 권한 회수 또는 만료 | `/login` 으로 재발급 | `src/services/api/errors.ts` |
| `Your account does not have access to Claude Code. Please run /login.` | 계정 권한 부족 | 조직 또는 계정 구독 조건 불충족 | 다른 계정 사용 또는 관리자 확인 | `src/services/api/errors.ts` |

---

## 6. 네트워크 / SSL / 연결 오류

| 대표 메시지 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `Request timed out. Check your internet connection and proxy settings` | 요청 시간 초과 | 느린 네트워크, 프록시 지연, 방화벽 | 네트워크/프록시 확인 후 재시도 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API. Check your internet connection` | 일반 연결 실패 | DNS, 라우팅, 방화벽 | 인터넷과 endpoint 확인 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: SSL certificate verification failed...` | 인증서 검증 실패 | 사내 프록시, 미신뢰 루트 인증서 | `NODE_EXTRA_CA_CERTS` 또는 프록시 인증서 신뢰 설정 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: Self-signed certificate detected...` | self-signed 감지 | 내부 프록시 또는 로컬 reverse proxy | 신뢰 저장소 반영 또는 프록시 구성 수정 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: SSL certificate hostname mismatch` | 인증서 host 불일치 | 잘못된 endpoint, 프록시 재서명 | base URL 과 인증서 CN/SAN 확인 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: SSL certificate has expired` | 인증서 만료 | 서버 또는 프록시 인증서 갱신 필요 | 인증서 갱신 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: SSL certificate has been revoked` | 인증서 폐기 | 보안 정책 또는 손상된 인증서 | 인증서 교체 | `src/services/api/errorUtils.ts` |
| `Unable to connect to API: SSL certificate is not yet valid` | 인증서 유효 기간 시작 전 | 서버 시간 오차, 잘못된 인증서 | 시스템 시간과 인증서 갱신 확인 | `src/services/api/errorUtils.ts` |

운영 팁:

- SSL 계열 메시지는 “API key 문제”가 아니라 TLS 신뢰 체인 문제인 경우가 많다.
- 사내 프록시 환경이라면 `NODE_EXTRA_CA_CERTS` 힌트가 나오는지 먼저 본다.

---

## 7. 모델 접근 / API 분류 오류

| 대표 메시지 또는 분류 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `The model ... is not available on your ... deployment...` | 해당 배포에서 모델 미지원 | 잘못된 모델명, provider 배포 정책 | `/model` 또는 `--model` 로 지원 모델 전환 | `src/services/api/errors.ts` |
| Bedrock 모델 접근 오류 안내 | Bedrock 라우팅 또는 모델 권한 부족 | IAM 또는 Bedrock model access 미설정 | fallback 모델 전환 또는 AWS 권한 확인 | `src/services/api/errors.ts` |
| `rate_limit` | 요청 속도 제한 | provider quota 초과 | backoff 후 재시도 | `classifyAPIError()` |
| `server_overload` | 서버 과부하 | provider 측 capacity 부족 | 지연 후 재시도 | `classifyAPIError()` |
| `prompt_too_long` | 컨텍스트 길이 초과 | compact 미적용, 큰 tool result | `/compact`, memory/attachment 검토 | `classifyAPIError()` |
| `invalid_model` | 모델 식별 실패 | 오타, 미지원 모델명 | 모델명 수정 | `classifyAPIError()` |
| `credit_balance_low` | 잔액 부족 | 과금 계정 한도 소진 | 과금 상태 확인 | `classifyAPIError()` |
| `invalid_api_key` | API key 무효 | 잘못된 key 또는 만료 | key 재설정 | `classifyAPIError()` |
| `token_revoked` | 토큰 폐기 | OAuth 또는 session revoke | 재로그인 | `classifyAPIError()` |
| `oauth_org_not_allowed` | 조직 정책으로 거부 | 조직 allowlist 또는 계약 조건 | 조직 관리자 확인 | `classifyAPIError()` |
| `auth_error` | 일반 인증 오류 | 토큰/권한 문제 | 로그인 또는 키 재설정 | `classifyAPIError()` |
| `server_error` | 서버 내부 오류 | provider 일시 장애 | 재시도 | `classifyAPIError()` |
| `client_error` | 요청 형식 오류 | payload, 옵션, model mismatch | 최근 입력과 요청 구조 확인 | `classifyAPIError()` |
| `unknown` | 분류 실패 | 신규 에러 패턴 또는 미처리 case | raw error payload 확인 | `classifyAPIError()` |

추가 분류로 존재하는 항목:

- `aborted`
- `api_timeout`
- `pdf_too_large`
- `pdf_password_protected`
- `image_too_large`
- `tool_use_mismatch`
- `unexpected_tool_result`
- `duplicate_tool_use_id`
- `ssl_cert_error`
- `connection_error`

이 분류들은 사용자 메시지와 1:1 대응하지 않을 수도 있으므로, 운영 분석이나 telemetry 해석 시 특히 유용하다.

---

## 8. 세션 / resume / voice / web session 오류

| 대표 메시지 | 발생 기능 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `No conversations found to resume` | `/resume` | resume 가능한 세션 없음 | 세션 저장 위치와 최근 대화 존재 여부 확인 | `src/commands/resume/resume.tsx` |
| `No conversations found to resume.` | `/resume` | 위와 동일 | 동일 | `src/commands/resume/resume.tsx` |
| `Voice mode requires a Claude.ai account. Please run /login to sign in.` | voice mode | API key 만 있고 Claude.ai 로그인 없음 | `/login` 수행 | `src/commands/voice/voice.ts`, `src/tools/ConfigTool/ConfigTool.ts`, `src/hooks/useVoice.ts` |
| `Claude Code web sessions require authentication with a Claude.ai account...` | teleport / web session | API key 인증만 존재 | Claude.ai 계정으로 로그인 | `src/utils/teleport.tsx`, `src/utils/teleport/api.ts`, `src/utils/teleport/environments.ts` |
| `Session expired. Please run /login to sign in again.` | teleport / web session | 세션 만료 | `/login` 재실행 | `src/utils/teleport/api.ts` |

---

## 9. MCP 오류

| 대표 메시지 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `Error: Directory <cwd> does not exist` | MCP server 시작 경로 오류 | 잘못된 cwd | 경로 재확인 | `src/cli/handlers/mcp.tsx` |
| `Error: Failed to start MCP server: ...` | MCP 프로세스 시작 실패 | 실행 파일 없음, 권한 문제, 설정 오류 | server command 와 env 확인 | `src/cli/handlers/mcp.tsx` |
| `No MCP server found with name: "<name>"` | 이름으로 조회 실패 | 설정에 없는 이름 | `.mcp.json` 또는 저장된 config 확인 | `src/cli/handlers/mcp.tsx` |
| `No MCP servers configured. Use \`claude mcp add\` to add a server.` | 등록된 MCP 없음 | 초기 설정 미완료 | MCP 등록 | `src/cli/handlers/mcp.tsx` |
| `Server not found: <serverName>` | 실행 중 server lookup 실패 | 런타임 캐시와 설정 불일치 | 등록 목록과 control 경로 확인 | `src/cli/print.ts` |
| `No MCP server found with name: <name> in .mcp.json` | 로컬 설정 파일 조회 실패 | `.mcp.json` 에 선언 없음 | 설정 파일 수정 | `src/services/mcp/config.ts` |

운영 팁:

- MCP 오류는 “설정 없음”, “프로세스 시작 실패”, “런타임 lookup 실패” 세 갈래로 나누면 진단이 빨라진다.

---

## 10. Plugin / marketplace 오류

| 대표 메시지 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `Validation failed` | plugin manifest 또는 구조 검증 실패 | `plugin.json` 스키마 불일치 | validate 결과 상세 확인 | `src/cli/handlers/plugins.ts` |
| `failed to load` | plugin 로딩 실패 | 파일 누락, hook/command parse 오류 | 상세 경로와 stack 확인 | `src/cli/handlers/plugins.ts` |
| `Invalid marketplace source format. Try: owner/repo, https://..., or ./path` | marketplace source 형식 오류 | 잘못된 install source | 형식 수정 | `src/cli/handlers/plugins.ts` |
| `Invalid scope '...'` 또는 `Invalid scope: ...` | scope 값 오류 | `user`, `project`, `local` 이외 값 사용 | 유효 scope 로 수정 | `src/cli/handlers/plugins.ts` |
| `Please specify a plugin name or use --all to disable all plugins` | disable 대상 미지정 | 인자 누락 | plugin 명 지정 또는 `--all` 사용 | `src/cli/handlers/plugins.ts` |

plugin 구조 자체는 [플러그인 / 훅 가이드](D:/project/openpro/docs/openpro-plugin-hook-guide-ko.md)에서 더 자세히 다룬다.

---

## 11. 업데이트 오류

| 대표 메시지 | 의미 | 원인 후보 | 1차 대응 | 코드 기준 |
|---|---|---|---|---|
| `Auto-update is not available for third-party provider builds.` | 자동 업데이트 비지원 빌드 | third-party build | 수동 업데이트 사용 | `src/cli/update.ts` |
| `Warning: Multiple installations found` | 설치본이 여러 개 | PATH 또는 패키지 중복 설치 | 실제 실행 바이너리 확인 | `src/cli/update.ts` |
| `Warning: Cannot update development build` | 개발 빌드 업데이트 불가 | 소스 실행 중 | 패키지 빌드 또는 수동 갱신 | `src/cli/update.ts` |
| `Please use your package manager to update.` | 자체 업데이트 경로 아님 | 설치 방식 차이 | npm, brew 등 패키지 매니저 사용 | `src/cli/update.ts` |
| `Warning: Configuration mismatch` | 설치 구성 불일치 | 예상 경로와 실제 설치 경로 불일치 | 설치 구조 점검 | `src/cli/update.ts` |
| `Another Claude process ... is currently running. Please try again in a moment.` | 동시 업데이트 충돌 | 다른 프로세스 실행 중 | 잠시 후 재시도 | `src/cli/update.ts` |
| `Error: Failed to install native update` | native update 실패 | 권한, 파일 잠금 | 관리자 권한 또는 잠금 해제 | `src/cli/update.ts` |
| `Unable to fetch latest version from npm registry` | 최신 버전 조회 실패 | 네트워크, registry 접근 실패 | npm registry 접근 확인 | `src/cli/update.ts` |
| `Error: Insufficient permissions to install update` | 권한 부족 | 시스템 경로 쓰기 권한 부족 | 관리자 권한 또는 사용자 경로 설치 | `src/cli/update.ts` |
| `Error: Another instance is currently performing an update` | 동시 업데이트 진행 중 | lock 충돌 | 잠시 후 재시도 | `src/cli/update.ts` |

---

## 12. 메시지를 기준으로 분류하기 어려울 때 보는 순서

1. 시작 직후면 `src/entrypoints/cli.tsx`
2. 로그인 동작 중이면 `src/cli/handlers/auth.ts`
3. 모델 호출 중이면 `src/services/api/errorUtils.ts` 와 `src/services/api/errors.ts`
4. `/resume`, voice, web session 이면 해당 기능 파일
5. MCP, plugin, update 는 각각 전용 handler

이 다섯 단계만 기억해도 대부분의 운영 이슈는 1차 분류가 된다.

---

## 13. QA 테스트 포인트

### 13.1 provider 검증

- Gemini, GitHub, OpenAI, Codex 각각 필수 env 누락 시 올바른 메시지가 나오는지
- local base URL 이면 OpenAI API key 요구가 사라지는지

### 13.2 인증

- interactive 와 non-interactive 에서 인증 오류 문구가 다르게 나오는지
- revoked token 과 not logged in 을 구분하는지

### 13.3 네트워크 / SSL

- timeout, self-signed, hostname mismatch, expired certificate 를 서로 다른 문구로 식별하는지

### 13.4 기능별 오류

- `/resume` 세션 없음
- voice mode 로그인 필요
- web session 만료
- MCP server 이름 없음
- plugin scope 오류
- update lock 충돌

---

## 14. 문서 유지보수 기준

다음이 바뀌면 이 문서를 갱신해야 한다.

- `src/entrypoints/cli.tsx` 의 초기 env 검증 메시지
- `src/services/api/errorUtils.ts` 의 네트워크 / SSL 문구
- `src/services/api/errors.ts` 의 분류 기준과 대표 메시지
- MCP, plugin, update handler 의 사용자 노출 메시지

함께 갱신하면 좋은 문서:

- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)
- [인증 / 자격증명 가이드](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md)
- [API 가이드](D:/project/openpro/docs/openpro-api-guide-ko.md)
