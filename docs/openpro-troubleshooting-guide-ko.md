# OpenPro 트러블슈팅 가이드

## 1. 문서 목적

이 문서는 OpenPro를 운영하거나 개발할 때 자주 만나는 문제를 증상 기준으로 빠르게 좁혀가기 위한 실전 대응 가이드다. 단순 FAQ가 아니라 “어떤 소스 파일을 보면 원인을 확정할 수 있는가”까지 함께 정리했다.

---

## 2. 가장 빠른 1차 분류

문제가 생기면 먼저 아래 다섯 축 중 어디인지 구분하는 것이 좋다.

1. build/feature gate 문제인가
2. provider / 인증 문제인가
3. 네트워크 / SSL / 프록시 문제인가
4. retry / rate limit / capacity 문제인가
5. remote-control과 server를 혼동한 문제인가

이 다섯 축만 먼저 나눠도 원인 탐색 시간이 크게 줄어든다.

---

## 3. 증상별 빠른 대응

## 3.1 명령이 코드에는 보이는데 실행 파일에는 없다

### 대표 증상

- `server` 명령이 없다
- `remote-control`이 안 보인다
- `assistant`, `daemon`, `ps`, `logs`가 안 보인다

### 가장 흔한 원인

- 오픈 빌드에서 `feature()` 분기가 제거됨

### 확인할 파일

- `scripts/build.ts`
- `src/entrypoints/cli.tsx`
- `src/main.tsx`

### 바로 확인할 포인트

- `scripts/build.ts`의 `bun-bundle-shim`이 `feature() => false`인지
- 해당 명령 등록이 `feature('...')` 안에 있는지

### 대응

- 현재 빌드 변형이 오픈 빌드인지 확인
- 문서에는 기능이 있어도 실제 바이너리에는 포함되지 않았을 수 있음을 구분

---

## 3.2 `remote-control`이 안 되거나 unavailable 메시지가 나온다

### 대표 증상

- “You must be logged in to use Remote Control”
- “Remote Control requires a claude.ai subscription”
- “Remote Control is disabled by your organization's policy”
- 명령 자체가 없음

### 가장 흔한 원인

- `BRIDGE_MODE` build gate 비활성
- Claude.ai OAuth 부재
- inference-only token 사용
- 조직 UUID 미해석
- GrowthBook gate 미통과
- `allow_remote_control=false`

### 확인할 파일

- `src/bridge/bridgeEnabled.ts`
- `src/utils/auth.ts`
- `src/entrypoints/cli.tsx`
- `src/bridge/bridgeMain.ts`

### 대응

- 먼저 build gate부터 확인
- 그다음 OAuth token source와 scope 확인
- 마지막으로 정책과 조직 gate 확인

참고:

- `remote-control`은 direct connect 서버가 아니다
- `openpro server`가 필요한지 다시 판단해야 할 수 있다

---

## 3.3 `server` 관련 기능이 안 보이거나 `cc://` 흐름이 동작하지 않는다

### 대표 증상

- `openpro server` 명령이 없음
- `cc://...` URL을 열어도 반응이 없음

### 가장 흔한 원인

- `DIRECT_CONNECT` build gate 비활성

### 확인할 파일

- `src/main.tsx`
- `src/server/createDirectConnectSession.ts`
- `src/server/directConnectManager.ts`
- `scripts/build.ts`

### 대응

- 코드에 `src/server/*`가 존재해도 build gate가 false면 사용자 명령은 빠질 수 있다
- direct connect와 remote-control을 구분해서 판단한다

---

## 3.4 시작하자마자 provider 환경 검증에서 실패한다

### 대표 증상

- `GEMINI_API_KEY is required...`
- `GITHUB_TOKEN or GH_TOKEN is required...`
- `Invalid OPENAI_API_KEY: placeholder value SUA_CHAVE...`
- `Codex auth is required...`
- `Codex auth is missing chatgpt_account_id...`

### 가장 흔한 원인

- 기동 전 검증에 걸림

### 확인할 파일

- `src/entrypoints/cli.tsx`
- `src/services/api/providerConfig.ts`

### 대응

- Gemini: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- GitHub Models: `GITHUB_TOKEN` 또는 `GH_TOKEN`
- OpenAI 호환: local base URL이 아니면 `OPENAI_API_KEY`
- Codex: `CODEX_API_KEY` 또는 유효한 `auth.json` + account id

---

## 3.5 로그인은 했는데 기대한 인증 소스가 아닌 것 같다

### 대표 증상

- Claude.ai subscriber인데 API key 경로를 타는 것 같다
- `/login` key보다 `apiKeyHelper`가 우선된다
- token과 key가 동시에 설정되어 헷갈린다

### 가장 흔한 원인

- `apiKeyHelper` 우선권
- `ANTHROPIC_API_KEY` 또는 `ANTHROPIC_AUTH_TOKEN`이 남아 있음
- inference-only OAuth 토큰 사용
- managed OAuth context와 일반 터미널 auth가 섞임

### 확인할 파일

- `src/utils/auth.ts`
- `src/utils/statusNoticeDefinitions.tsx`

### 대응

- 현재 `getAuthTokenSource()`와 `getAnthropicApiKeyWithSource()`의 결과를 기준으로 판단
- 외부 env key/token을 비우고 다시 확인
- `apiKeyHelper`를 의도적으로 쓸지 `/login managed key`를 쓸지 먼저 정리

---

## 3.6 Codex는 key가 있는데도 계속 실패한다

### 대표 증상

- `Codex auth is required`
- `Codex auth is missing chatgpt_account_id`
- 웹 검색이나 responses 호출이 계정 ID 누락으로 실패

### 가장 흔한 원인

- `CODEX_API_KEY`는 있는데 account id가 없음
- `auth.json` 경로는 맞지만 내용 구조가 다름
- JWT claim에서 `chatgpt_account_id`를 복원하지 못함

### 확인할 파일

- `src/services/api/providerConfig.ts`
- `src/services/api/openaiShim.ts`
- `scripts/system-check.ts`

### 대응

- 우선순위 확인: `CODEX_AUTH_JSON_PATH` → `CODEX_HOME/auth.json` → `~/.codex/auth.json`
- `CODEX_ACCOUNT_ID` 또는 `CHATGPT_ACCOUNT_ID`를 명시하는 쪽이 가장 확실함

---

## 3.7 OpenAI 호환 provider인데 key가 없어도 되는지 헷갈린다

### 대표 증상

- local 모델 서버에서는 되는데 외부 provider에서는 안 됨
- GitHub Models는 `OPENAI_API_KEY` 없이도 되는 것 같음

### 가장 흔한 원인

- base URL이 local provider인지 여부
- GitHub Models token이 별도 변수/secure storage에서 hydrate됨

### 확인할 파일

- `src/services/api/providerConfig.ts`
- `src/entrypoints/cli.tsx`
- `src/utils/githubModelsCredentials.ts`

### 대응

- local URL이면 key 없는 허용 경로가 있을 수 있다
- GitHub mode는 `GITHUB_TOKEN` 또는 `GH_TOKEN`을 본다
- secure storage hydrate 여부도 같이 확인한다

---

## 3.8 401 또는 403이 반복된다

### 대표 증상

- 첫 요청 직후 401 재시도 반복
- OAuth refresh가 계속 실패
- revoke된 token처럼 보임

### 가장 흔한 원인

- 실제로 만료된 OAuth token
- refresh token 사망
- 다른 프로세스가 새 token으로 갱신했는데 현재 프로세스 cache가 오래됨
- provider와 auth source 조합이 맞지 않음

### 확인할 파일

- `src/utils/auth.ts`
- `src/services/api/withRetry.ts`
- `src/services/oauth/client.ts`

### 대응

- `getClaudeAIOAuthTokens()`가 inference-only token인지 확인
- 401 처리 시 `handleOAuth401Error()` 경로가 실제 refresh를 성공시키는지 확인
- cache invalidation과 secure storage 재로드를 확인

---

## 3.9 429 또는 529가 반복된다

### 대표 증상

- capacity overload
- rate limit
- fast mode에서 모델 전환/쿨다운이 걸림

### 가장 흔한 원인

- provider capacity 부족
- fast mode overage 제한
- foreground query라 529 retry 대상

### 확인할 파일

- `src/services/api/withRetry.ts`

### 코드 기준 핵심 사실

- 기본 최대 재시도는 10회
- foreground query source만 529 retry를 계속 시도한다
- 일부 stale connection에서는 keep-alive를 끄고 재연결한다
- fast mode는 429/529에서 cooldown으로 standard speed 모델로 떨어질 수 있다

### 대응

- foreground query인지 background query인지 구분
- 실제로 429인지 529인지 먼저 구분
- fast mode fallback이 개입했는지 확인

---

## 3.10 SSL / 프록시 / 인증서 오류가 난다

### 대표 증상

- `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- `SELF_SIGNED_CERT_IN_CHAIN`
- `ERR_TLS_CERT_ALTNAME_INVALID`
- `Connection error.`

### 가장 흔한 원인

- 기업 프록시
- TLS intercept
- CA bundle 누락
- hostname mismatch

### 확인할 파일

- `src/services/api/errorUtils.ts`
- `src/cli/handlers/auth.ts`
- `src/utils/preflightChecks.tsx`

### 코드 기준 핵심 메시지

`getSSLErrorHint()`는 다음 가이드를 준다.

- `NODE_EXTRA_CA_CERTS`에 CA bundle 경로 설정
- IT에 `*.anthropic.com` allowlist 요청
- `/doctor` 실행

즉, SSL 오류는 단순 네트워크 불안정이 아니라 인증서 체인 문제로 따로 다뤄야 한다.

---

## 3.11 direct connect 세션 생성에서 실패한다

### 대표 증상

- `Failed to connect to server at ...`
- `Failed to create session: 401/403/...`
- `Invalid session response: ...`
- WebSocket connection error

### 가장 흔한 원인

- `/sessions` 호출 실패
- bearer token 불일치
- 응답 schema 불일치
- WebSocket 헤더/주소 문제

### 확인할 파일

- `src/server/createDirectConnectSession.ts`
- `src/server/directConnectManager.ts`
- `src/server/types.ts`

### 대응

- HTTP 단계와 WS 단계를 분리해서 확인
- `session_id`, `ws_url`, `work_dir` 응답 구조가 맞는지 먼저 확인
- permission request가 `control_request` / `control_response` 계약을 맞추는지 확인

---

## 3.12 bridge 세션은 보이는데 원격과 동기화가 어색하다

### 대표 증상

- 세션 제목이 늦게 바뀜
- inbound/outbound 이벤트가 맞지 않음
- 이전 메시지가 중복 전송된 것 같음

### 가장 흔한 원인

- REPL 초기 flush 중복 방지 로직
- title derivation 타이밍
- env-based와 env-less 경로 차이

### 확인할 파일

- `src/bridge/initReplBridge.ts`
- `src/bridge/replBridge.ts`
- `src/bridge/remoteBridgeCore.ts`
- `src/bridge/createSession.ts`

---

## 4. 유지보수자가 가장 먼저 열어볼 소스 맵

| 문제 축 | 가장 먼저 볼 파일 |
|---|---|
| 빌드/명령 노출 | `scripts/build.ts`, `src/entrypoints/cli.tsx`, `src/main.tsx` |
| Anthropic 인증 | `src/utils/auth.ts`, `src/services/oauth/client.ts` |
| OpenAI/Codex/GitHub/Gemini | `src/services/api/providerConfig.ts`, `src/entrypoints/cli.tsx` |
| API retry/네트워크 | `src/services/api/withRetry.ts`, `src/services/api/errorUtils.ts` |
| Remote Control | `src/bridge/bridgeEnabled.ts`, `src/bridge/bridgeMain.ts`, `src/bridge/initReplBridge.ts` |
| Direct Connect | `src/server/createDirectConnectSession.ts`, `src/server/directConnectManager.ts` |

---

## 5. 가장 유용한 확인 명령

```powershell
rg "feature\\('" src scripts
```

```powershell
rg -n "remote-control|bridgeMain|DIRECT_CONNECT|cc://|server" src
```

```powershell
rg -n "getAuthTokenSource|getAnthropicApiKeyWithSource|CODEX_API_KEY|auth.json|OPENAI_API_KEY|GITHUB_TOKEN|GEMINI_API_KEY" src
```

```powershell
rg -n "withRetry|extractConnectionErrorDetails|SSL|CERT_|ETIMEDOUT" src/services/api
```

---

## 6. 관련 문서

- build/feature 차이는 `openpro-feature-flag-build-guide-ko.md`
- Remote Control 구조는 `openpro-remote-control-bridge-guide-ko.md`
- 인증 우선순위는 `openpro-auth-credential-guide-ko.md`
- API 흐름은 `openpro-api-guide-ko.md`
- direct connect는 `openpro-server-mode-guide-ko.md`

---

## 7. 한 줄 요약

OpenPro 장애 대응은 “기능이 빌드에 포함됐는가 → 올바른 provider/auth가 선택됐는가 → 네트워크/재시도 계층에서 막히는가 → remote-control과 server 중 어느 시스템 문제인가” 순서로 좁혀가면 가장 빠르다.
