# OpenPro 인증 / 자격증명 우선순위 가이드

## 1. 문서 목적

이 문서는 OpenPro가 어떤 인증 정보를 어떤 우선순위로 읽는지, 왜 사용자가 기대한 자격증명과 다른 값이 선택될 수 있는지, provider별로 어디를 확인해야 하는지를 코드 기준으로 풀어쓴 운영 가이드다.

특히 다음 상황을 해결하기 위해 작성했다.

- Claude.ai 로그인은 했는데 API key가 잡히는 것 같다
- `apiKeyHelper`를 넣었더니 /login 키보다 우선되는 것 같다
- Codex는 왜 `auth.json`과 account id를 둘 다 보나
- GitHub Models는 왜 환경 변수 없이도 동작할 수 있나
- bare mode에서는 왜 secure storage가 안 먹나

---

## 2. 가장 큰 그림

OpenPro의 인증은 하나의 축으로 끝나지 않는다.

### 2.1 Anthropic 1P 계열

Anthropic first-party 경로는 인증 축이 두 갈래다.

- bearer token 계열
- API key 계열

둘 다 동시에 존재할 수 있어서 충돌 감지가 필요하다.

### 2.2 3P provider 계열

다음 provider는 Anthropic OAuth와 별개 자격증명을 쓴다.

- OpenAI 호환 provider
- GitHub Models
- Gemini
- Codex
- Bedrock
- Vertex
- Foundry

### 2.3 한 줄 요약

“어떤 provider를 선택했는가”가 1차 분기이고, 그 provider 안에서 다시 “토큰 vs API key vs secure storage vs file descriptor vs auth.json” 우선순위가 갈린다.

---

## 3. 먼저 봐야 할 핵심 파일

| 파일 | 역할 |
|---|---|
| `src/utils/auth.ts` | Anthropic 계열 토큰/API key 선택, OAuth 저장, refresh |
| `src/services/oauth/client.ts` | Claude.ai auth scope 해석, token exchange/refresh |
| `src/services/api/client.ts` | 실제 provider별 client 생성 |
| `src/services/api/providerConfig.ts` | OpenAI/Codex/GitHub/Gemini 계열 model/baseUrl/credential 해석 |
| `src/entrypoints/cli.tsx` | 기동 직전 provider 자격증명 검증 |
| `src/utils/githubModelsCredentials.ts` | GitHub Models token secure storage 읽기/주입 |
| `src/utils/statusNoticeDefinitions.tsx` | 충돌 경고 메시지 조건 |

---

## 4. 1차 분기: 어떤 provider family를 쓰는가

기동 단계에서 가장 먼저 중요한 것은 현재 어떤 provider family가 선택되었는가다.

`src/services/api/client.ts`는 대략 아래 순서로 분기한다.

- OpenAI / GitHub / Gemini면 OpenAI shim 경로
- Bedrock면 Bedrock SDK
- Foundry면 Foundry SDK
- Vertex면 Vertex SDK
- 그 외는 Anthropic first-party 경로

즉, 사용자가 `/provider` 또는 환경 변수로 어느 family를 켰는지가 가장 먼저 인증 방식을 바꾼다.

---

## 5. Anthropic 계열에서 bearer token을 고르는 순서

토큰 쪽 우선순위는 `getAuthTokenSource()`가 결정한다.

### 5.1 bare mode

`--bare`에서는 bearer token 경로를 사실상 닫는다.

- 허용되는 토큰형 소스는 `apiKeyHelper`뿐이다
- OAuth env token
- file descriptor token
- keychain/secure storage token

이들은 무시된다.

### 5.2 일반 모드 우선순위

일반 모드에서 `getAuthTokenSource()`의 우선순위는 아래와 같다.

1. `ANTHROPIC_AUTH_TOKEN`
2. `CLAUDE_CODE_OAUTH_TOKEN`
3. `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR` 또는 CCR disk fallback
4. `apiKeyHelper`
5. secure storage에 저장된 `claude.ai` OAuth
6. 없으면 `none`

표로 보면 더 명확하다.

| 순서 | 소스 | 설명 |
|---|---|---|
| 1 | `ANTHROPIC_AUTH_TOKEN` | managed OAuth context가 아닐 때만 사용 |
| 2 | `CLAUDE_CODE_OAUTH_TOKEN` | 강제 주입된 OAuth token |
| 3 | file descriptor / CCR file | subprocess나 CCR 경로용 fallback 포함 |
| 4 | `apiKeyHelper` | 설정에 helper가 있으면 존재 자체가 우선권을 가짐 |
| 5 | secure storage의 `claudeAiOauth` | 일반 `/login` 경로에서 저장된 Claude.ai OAuth |

중요한 점:

- `apiKeyHelper`는 “실행 결과”보다 “구성되어 있음” 자체가 우선권을 가진다.
- helper cache가 아직 차지 않았더라도 다른 소스로 떨어지지 않도록 설계되어 있다.

---

## 6. Anthropic 계열에서 API key를 고르는 순서

API key는 `getAnthropicApiKeyWithSource()`가 선택한다.

### 6.1 bare mode

bare mode에서는 아래 둘만 본다.

1. `ANTHROPIC_API_KEY`
2. `apiKeyHelper`

그 외는 보지 않는다.

### 6.2 일반 모드 우선순위

일반 모드 우선순위는 대략 다음과 같다.

1. 승인된 `ANTHROPIC_API_KEY`
2. API key file descriptor
3. `apiKeyHelper`
4. `/login managed key` 또는 macOS keychain / global config
5. 없으면 `none`

표로 정리하면:

| 순서 | 소스 | 설명 |
|---|---|---|
| 1 | `ANTHROPIC_API_KEY` | global config의 approved 목록에 들어간 key일 때 우선 |
| 2 | file descriptor | CI/비대화 경로 포함 |
| 3 | `apiKeyHelper` | 캐시가 비어 있어도 다른 소스로 내려가지 않음 |
| 4 | `/login managed key` | macOS keychain 또는 `config.primaryApiKey` |

### 6.3 `apiKeyHelper`가 특별한 이유

이 helper는 사용자 설정 스크립트이기 때문에 다음 특징이 있다.

- TTL cache를 가진다
- cold cache일 때 동기 fallback으로 다른 인증으로 내려가지 않는다
- helper가 project/local settings에서 왔으면 trust 확정 전에는 prefetch를 막는다

즉, 운영자가 보기에는 “helper가 있으면 얘가 사실상 인증 소스 우선권을 잡는다”로 이해하는 편이 맞다.

---

## 7. Claude.ai OAuth는 어디에 저장되는가

`getClaudeAIOAuthTokens()`는 아래 순서로 OAuth 토큰을 읽는다.

1. bare mode면 `null`
2. `CLAUDE_CODE_OAUTH_TOKEN`
3. OAuth token file descriptor
4. secure storage의 `claudeAiOauth`

여기서 env/file descriptor로 들어온 토큰은 다음 특징을 가진다.

- `refreshToken` 없음
- `expiresAt` 없음
- scope는 `user:inference`만 가진 것으로 간주

즉, 이런 토큰은 일반 Claude.ai full login과 다르다.

이 차이가 Remote Control이나 profile-scoped API에서 직접 드러난다.

---

## 8. `isAnthropicAuthEnabled()`가 의미하는 것

이 함수는 “Anthropic OAuth를 쓸 수 있는 상태인가”를 판정한다.

다음 경우에는 first-party Anthropic auth를 꺼버린다.

- bare mode
- Bedrock / Vertex / Foundry / OpenAI / Gemini / GitHub 같은 3P provider 사용 중
- 외부 `ANTHROPIC_AUTH_TOKEN`, `apiKeyHelper`, API key helper/file descriptor가 있고 managed OAuth context가 아님

즉, 사용자가 Claude.ai 로그인 상태여도 외부 API key를 넣어두면 OAuth가 비활성화될 수 있다.

---

## 9. provider별 자격증명 해석

### 9.1 Anthropic first-party

가능한 소스:

- Claude.ai OAuth
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_API_KEY`
- `apiKeyHelper`
- `/login managed key`

주의:

- subscriber 경로와 API customer 경로가 섞일 수 있다
- 충돌 notice가 별도로 뜬다

### 9.2 OpenAI 호환 provider

핵심 변수:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

주의:

- base URL이 local provider면 key 없이 허용될 수 있다
- `SUA_CHAVE` placeholder는 명시적으로 차단된다

### 9.3 GitHub Models

핵심 변수:

- `GITHUB_TOKEN` 또는 `GH_TOKEN`

추가 특징:

- `src/utils/githubModelsCredentials.ts`가 secure storage에서 token을 읽어 `process.env.GITHUB_TOKEN`으로 hydrate할 수 있다
- 단, `CLAUDE_CODE_USE_GITHUB=1`일 때만 동작한다
- bare mode에서는 secure storage hydration이 비활성화된다

### 9.4 Gemini

핵심 변수:

- `GEMINI_API_KEY`
- 또는 `GOOGLE_API_KEY`

### 9.5 Codex

핵심 변수:

- `CODEX_API_KEY`
- `CODEX_ACCOUNT_ID` 또는 `CHATGPT_ACCOUNT_ID`
- `CODEX_AUTH_JSON_PATH`
- `CODEX_HOME`

`resolveCodexAuthPath()` 우선순위는 다음과 같다.

1. `CODEX_AUTH_JSON_PATH`
2. `CODEX_HOME/auth.json`
3. `~/.codex/auth.json`

`resolveCodexApiCredentials()`는 다음 순서로 본다.

1. `CODEX_API_KEY`
2. env의 account id
3. `auth.json`의 token / account id
4. token 안의 JWT claim에서 `chatgpt_account_id` 추출

즉, Codex는 단순 API key 하나로 끝나지 않고 account id 해석이 매우 중요하다.

### 9.6 Bedrock

핵심:

- AWS credential refresh 경로 사용
- `refreshAndGetAwsCredentials()`가 필요 시 갱신
- 일부 모델은 region override를 따로 가질 수 있다

### 9.7 Vertex

핵심:

- GCP credential refresh
- `ANTHROPIC_VERTEX_PROJECT_ID`
- `CLOUD_ML_REGION` 및 모델별 region 변수

### 9.8 Foundry

핵심:

- `ANTHROPIC_FOUNDRY_API_KEY` 또는 Azure AD
- API key가 없으면 `DefaultAzureCredential` 경로로 간다

---

## 10. 기동 시점의 검증은 어디서 하는가

`src/entrypoints/cli.tsx`는 실제 UI가 뜨기 전에 provider 환경을 검증한다.

대표 검증:

- Gemini인데 key 없음
- GitHub mode인데 token 없음
- OpenAI key가 placeholder `SUA_CHAVE`
- Codex transport인데 API key/auth.json 없음
- Codex account id 없음
- OpenAI mode인데 non-local base URL인데 key 없음

즉, “프로세스는 떴는데 첫 요청에서 터진다”가 아니라, 일부 케이스는 시작 자체를 막는다.

---

## 11. 충돌 감지와 상태 안내

`src/utils/statusNoticeDefinitions.tsx`는 다음 같은 충돌을 사용자에게 경고한다.

### 11.1 Claude.ai subscriber인데 외부 token 사용

예:

- `ANTHROPIC_AUTH_TOKEN`
- `apiKeyHelper`

이 경우 “구독 토큰 대신 외부 token을 쓰고 있다”는 경고가 뜬다.

### 11.2 `/login managed key`가 있는데 외부 API key가 우선 사용 중

예:

- `ANTHROPIC_API_KEY`
- `apiKeyHelper`

### 11.3 token과 API key가 동시에 설정됨

이 경우 예상치 못한 동작이 날 수 있다는 경고를 보여준다.

즉, OpenPro는 단순히 인증을 읽고 끝내는 것이 아니라 “지금 왜 이런 인증 조합이 위험한지”를 UI에서도 설명하려고 한다.

---

## 12. managed OAuth context와 일반 터미널의 차이

`isManagedOAuthContext()`는 다음 경우를 특별 취급한다.

- `CLAUDE_CODE_REMOTE=true`
- `CLAUDE_CODE_ENTRYPOINT=claude-desktop`

이 문맥에서는 사용자의 일반 터미널용 API key 설정이 관리형 세션에 섞여 들어가면 안 되기 때문에, 일부 외부 auth fallback을 막는다.

이건 운영상 매우 중요하다.

왜냐하면 사용자가 자기 터미널에서는 API key를 쓰더라도, 데스크톱이나 CCR 세션이 그 설정을 그대로 집어오면 잘못된 조직/구독 컨텍스트가 섞일 수 있기 때문이다.

---

## 13. 실제 운영에서 자주 보는 사례

### 13.1 “로그인했는데 왜 Claude.ai subscriber로 안 잡히지?”

주요 원인:

- `CLAUDE_CODE_OAUTH_TOKEN`처럼 inference-only token 사용
- 외부 API key 또는 `apiKeyHelper`가 OAuth를 밀어냄

### 13.2 “apiKeyHelper를 넣었더니 /login key가 안 먹는다”

정상일 수 있다.

이 helper는 우선순위가 높고 fallback도 막기 때문이다.

### 13.3 “Codex는 key가 있는데도 계속 account id 없다고 한다”

주요 원인:

- `CHATGPT_ACCOUNT_ID` 또는 `CODEX_ACCOUNT_ID`가 없음
- `auth.json` 안에 account id가 없음
- token claim에서 계정 ID를 추출할 수 없음

### 13.4 “GitHub Models는 env에 token이 없는데도 된다”

주요 원인:

- secure storage에 저장된 token을 startup에서 hydrate했기 때문

---

## 14. 유지보수자가 읽으면 좋은 순서

1. `src/utils/auth.ts`
2. `src/services/oauth/client.ts`
3. `src/services/api/client.ts`
4. `src/services/api/providerConfig.ts`
5. `src/entrypoints/cli.tsx`
6. `src/utils/statusNoticeDefinitions.tsx`
7. `src/utils/githubModelsCredentials.ts`

이 순서로 보면 “토큰/API key 우선순위 → scope 의미 → provider 분기 → startup validation → 사용자 경고” 흐름이 잘 보인다.

---

## 15. 관련 문서

- provider 호출 구조는 `openpro-api-guide-ko.md`
- build variant 차이는 `openpro-feature-flag-build-guide-ko.md`
- Remote Control 쪽 인증 요구사항은 `openpro-remote-control-bridge-guide-ko.md`
- 증상별 대응은 `openpro-troubleshooting-guide-ko.md`

---

## 16. 한 줄 요약

OpenPro의 인증은 “어떤 provider를 쓰는가”와 “그 provider 안에서 어떤 소스가 우선권을 가지는가”의 두 단계로 결정되며, `apiKeyHelper`, inference-only OAuth, `auth.json`, secure storage가 각각 별도 우선순위와 제약을 가진다.
