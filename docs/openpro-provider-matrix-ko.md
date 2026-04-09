# OpenPro Provider 기능 비교 매트릭스

## 1. 문서 목적

이 문서는 OpenPro가 지원하는 모델 제공자 provider 를 코드 기준으로 비교 정리한 운영형 레퍼런스다.  
단순히 “어떤 제공자를 지원한다”는 설명이 아니라, 실제 런타임에서 어떤 조건으로 제공자가 선택되는지, 어떤 전송 계층 transport 를 타는지, 어떤 인증 수단이 필요한지, 어떤 기능이 Anthropic first-party 에만 열려 있는지까지 한 번에 확인할 수 있도록 구성했다.

이 문서는 다음 독자를 대상으로 한다.

- OpenPro에 새 provider 를 붙이거나 기존 provider 동작을 수정하려는 개발자
- 인증, 정책, 세션, 모델 접근 문제를 운영 기준으로 점검하려는 플랫폼 엔지니어와 DevOps
- provider 별 회귀 범위를 빠르게 정리해야 하는 QA

관련 상세 문서:

- [API 가이드](D:/project/openpro/docs/openpro-api-guide-ko.md)
- [인증 / 자격증명 가이드](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md)
- [환경변수 / 설정 키 레퍼런스](D:/project/openpro/docs/openpro-env-settings-reference-ko.md)
- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)

---

## 2. 먼저 이해할 핵심 6가지

1. OpenPro의 provider 는 단순 CLI 옵션 하나로만 정해지지 않는다. 실제 런타임 provider 판정은 `src/utils/model/providers.ts`의 환경 변수와 모델명 조합으로 결정된다.
2. `openai`, `github`, `gemini`는 모두 내부적으로 OpenAI 호환 shim 경로를 공유할 수 있다.
3. `codex`는 별도 `CLAUDE_CODE_USE_CODEX` 플래그가 있는 구조가 아니라, `CLAUDE_CODE_USE_OPENAI=1` 상태에서 Codex 계열 모델명이 들어올 때 `codex_responses` transport 로 분기된다.
4. `bedrock`, `vertex`, `foundry`는 OpenAI shim 이 아니라 Anthropic 전용 SDK 분기다.
5. bootstrap, policy limits, remote managed settings, Claude.ai MCP 동기화, 모델 capability refresh 같은 일부 보조 기능은 사실상 first-party Anthropic 경로에서만 동작한다.
6. Ollama, LM Studio, Atomic Chat, OpenRouter, Together, Groq, Mistral, DeepSeek 같은 배포 대상은 “별도 provider”라기보다 OpenAI 호환 계층 위에 올라가는 배포 프로파일로 보는 편이 구현과 더 잘 맞는다.

---

## 3. 핵심 소스 파일

| 파일 | 역할 | 문서를 읽을 때 보는 포인트 |
|---|---|---|
| `src/utils/model/providers.ts` | 런타임 provider 판정 | 어떤 환경 변수와 모델명이 어떤 provider 로 매핑되는지 |
| `src/utils/providerFlag.ts` | CLI `--provider` 파싱 | CLI 옵션 레벨에서 노출되는 provider 와 런타임 provider 의 차이 |
| `src/services/api/client.ts` | API client 생성 | provider 별로 어느 SDK 또는 shim 을 타는지 |
| `src/services/api/providerConfig.ts` | OpenAI/Codex/GitHub/Gemini 요청 설정 정규화 | base URL, transport, model alias, local provider 판정 |
| `src/services/api/openaiShim.ts` | OpenAI 호환 API를 Anthropic 스트림 형식으로 변환 | OpenAI-compatible 계열의 공통 구현 |
| `src/services/api/codexShim.ts` | Codex Responses API 적응 계층 | Codex 전용 응답 구조와 reasoning 처리 |
| `src/services/api/bootstrap.ts` | 부팅 시 bootstrap API | first-party 전용 보조 API 여부 확인 |
| `src/services/policyLimits/index.ts` | 원격 정책 한도 동기화 | Anthropic first-party 전용인지 확인 |
| `src/services/remoteManagedSettings/syncCache.ts` | 관리형 설정 캐시 동기화 | custom base URL 과 first-party 제약 확인 |
| `src/services/mcp/claudeai.ts` | Claude.ai MCP 서버 연동 | OAuth, scope, first-party 제약 확인 |
| `src/utils/model/modelCapabilities.ts` | 모델 capability refresh | first-party base URL 조건 확인 |
| `src/entrypoints/cli.tsx` | 기동 시 provider 입력 검증 | provider 별 필수 env 와 오류 메시지 |

---

## 4. 런타임 provider 판정 순서

실제 런타임 판정은 `src/utils/model/providers.ts`의 `getAPIProvider()` 가 담당한다.  
우선순위는 아래와 같다.

1. `CLAUDE_CODE_USE_GEMINI=1` 이면 `gemini`
2. 아니고 `CLAUDE_CODE_USE_GITHUB=1` 이면 `github`
3. 아니고 `CLAUDE_CODE_USE_OPENAI=1` 이면:
   Codex 계열 모델이면 `codex`, 아니면 `openai`
4. 아니고 `CLAUDE_CODE_USE_BEDROCK=1` 이면 `bedrock`
5. 아니고 `CLAUDE_CODE_USE_VERTEX=1` 이면 `vertex`
6. 아니고 `CLAUDE_CODE_USE_FOUNDRY=1` 이면 `foundry`
7. 아무 조건도 아니면 `firstParty`

Codex 계열 모델로 취급되는 대표 값:

- `codexplan`
- `codexspark`
- `gpt-5.4`
- `gpt-5.3-codex`
- `gpt-5.3-codex-spark`
- `gpt-5.2-codex`
- `gpt-5.1-codex-max`
- `gpt-5.1-codex-mini`

즉, `openai`와 `codex`의 차이는 “같은 OpenAI family 환경에서 어떤 transport 를 타는가”에 더 가깝다.

---

## 5. CLI `--provider` 와 런타임 provider 의 차이

CLI 파서 `src/utils/providerFlag.ts` 기준 `--provider`는 다음 값만 직접 받는다.

- `anthropic`
- `openai`
- `gemini`
- `github`
- `bedrock`
- `vertex`
- `ollama`

주의할 점:

- 런타임에는 `codex`, `foundry`, `firstParty` 같은 개념이 존재하지만 CLI `--provider` 값과 1:1 대응하지는 않는다.
- `ollama`는 별도 transport 를 가진 독립 provider 라기보다 OpenAI 호환 로컬 배포를 빠르게 고르는 편의 입력에 가깝다.
- `foundry`는 코드에는 provider 로 존재하지만 위 CLI 옵션 파서에서는 직접 노출되지 않는다.

운영 시에는 “CLI 노출 값”과 “실제 내부 provider 판정 값”을 구분해서 봐야 한다.

---

## 6. Provider 비교 매트릭스

| Provider | 활성화 조건 | 전송 계층 / client | 주 인증 방식 | 로컬 실행 가능 여부 | 특징 | 주요 제약 |
|---|---|---|---|---|---|---|
| `firstParty` | 별도 3rd-party env 없음 | Anthropic SDK | Claude.ai OAuth 또는 Anthropic 계열 인증 | 아니오 | bootstrap, 정책 동기화, Claude.ai MCP, capability refresh 등 first-party 부가 기능 사용 가능 | custom base URL 로 바꾸면 일부 부가 기능 비활성 |
| `openai` | `CLAUDE_CODE_USE_OPENAI=1` 이고 Codex 계열 모델이 아님 | `openaiShim.ts` + chat completions | `OPENAI_API_KEY` 또는 호환 API key | 예 | OpenAI, Azure OpenAI, OpenRouter, DeepSeek, Together, Groq, Mistral, Fireworks, LM Studio, Ollama 등 광범위한 호환 계층 | first-party 전용 부가 기능 대부분 비활성 |
| `codex` | `CLAUDE_CODE_USE_OPENAI=1` + Codex 계열 모델 또는 Codex base URL | `codexShim.ts` + responses | `CODEX_API_KEY` 또는 Codex/ChatGPT auth.json + account id | 부분적 | reasoning effort, Responses API, Codex alias 처리 | 일반 OpenAI chat completions 와 동작 차이가 있고 인증 누락 시 초기 검증에서 바로 실패 |
| `github` | `CLAUDE_CODE_USE_GITHUB=1` | `openaiShim.ts` | `GITHUB_TOKEN` 또는 `GH_TOKEN` | 아니오 | GitHub Models inference endpoint 사용, 모델명 정규화 보정 존재 | first-party 부가 기능 없음, GitHub 인증 필요 |
| `gemini` | `CLAUDE_CODE_USE_GEMINI=1` | `openaiShim.ts` 경유 OpenAI-compatible 형식 | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` | 아니오 | 런타임 provider 는 Gemini 로 구분되지만 호출 계층은 OpenAI shim 과 가까움 | provider 별 네이티브 기능보다 호환 계층 제약을 먼저 받음 |
| `bedrock` | `CLAUDE_CODE_USE_BEDROCK=1` | Anthropic Bedrock SDK | AWS credential chain | 아니오 | AWS Bedrock 환경 통합 | 모델 접근 권한 부족 시 Bedrock 전용 오류 처리 경로 |
| `vertex` | `CLAUDE_CODE_USE_VERTEX=1` | Anthropic Vertex SDK | GCP credential chain | 아니오 | Vertex 환경 통합 | first-party 부가 기능 없음 |
| `foundry` | `CLAUDE_CODE_USE_FOUNDRY=1` | Anthropic Foundry SDK | Foundry 계열 인증 | 아니오 | Foundry 전용 SDK 경로 | CLI `--provider` 직접 노출과 런타임 개념이 분리되어 있음 |

---

## 7. OpenAI 호환 계층에 포함되는 대표 배포 대상

다음 대상은 코드 상에서 별도 provider 가 아니라 OpenAI 호환 계층의 변형으로 보는 편이 정확하다.

| 배포 대상 | 일반적인 설정 방식 | 비고 |
|---|---|---|
| OpenAI | `OPENAI_API_KEY`, 기본 base URL | 가장 표준적인 OpenAI-compatible 경로 |
| Azure OpenAI | custom `OPENAI_BASE_URL` | API 형태는 호환이지만 운영 제약은 Azure 측 정책을 따름 |
| OpenRouter | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| DeepSeek | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| Together | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| Groq | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| Mistral | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| Fireworks | custom `OPENAI_BASE_URL` | OpenAI-compatible endpoint 로 취급 |
| Ollama | `OPENAI_BASE_URL=http://localhost:11434/v1` | 로컬 provider 로 간주될 수 있어 API key 없이도 가능 |
| LM Studio | localhost 기반 `OPENAI_BASE_URL` | 로컬 provider 판정 대상 |
| Atomic Chat | 로컬 또는 OpenAI-compatible base URL | 문서상 로컬 backend 로 안내됨 |

핵심은 `providerConfig.ts`의 `isLocalProviderUrl()` 이다.  
이 함수는 localhost, 127.x, `::1`, 사설 IP, `.local` 계열을 로컬 provider 로 판정하며, 이 경우 일부 API key 요구 검증이 완화된다.

---

## 8. First-party 전용 보조 기능 매트릭스

아래 기능은 “모델 호출” 자체와는 별개로 OpenPro 전체 경험에 영향을 주는 보조 기능이다.

| 기능 | firstParty | OpenAI-compatible | Codex | GitHub | Gemini | Bedrock/Vertex/Foundry | 코드 기준 |
|---|---|---|---|---|---|---|---|
| bootstrap API | 사용 | 대부분 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | `src/services/api/bootstrap.ts` |
| policy limits 동기화 | 사용 | 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | `src/services/policyLimits/index.ts` |
| remote managed settings sync | 사용 | custom base URL 이면 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | 건너뜀 | `src/services/remoteManagedSettings/syncCache.ts` |
| Claude.ai MCP 서버 동기화 | 사용 가능 | 불가 | 불가 | 불가 | 불가 | 불가 | `src/services/mcp/claudeai.ts` |
| model capabilities refresh | 사용 가능 | 불가 | 불가 | 불가 | 불가 | 불가 | `src/utils/model/modelCapabilities.ts` |

운영 포인트:

- provider 를 바꾸었을 때 “모델 응답은 되는데 일부 부가 기능이 사라진다”면 이 표부터 확인하는 것이 가장 빠르다.
- custom base URL 을 사용하는 first-party 변형도 일부 기능에서는 third-party 취급처럼 동작할 수 있다.

---

## 9. 인증 요구사항 비교

| Provider | 기동 시 필수 확인 항목 | 대표 실패 메시지 |
|---|---|---|
| Gemini | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` | `GEMINI_API_KEY is required when CLAUDE_CODE_USE_GEMINI=1.` |
| GitHub | `GITHUB_TOKEN` 또는 `GH_TOKEN` | `GITHUB_TOKEN or GH_TOKEN is required when CLAUDE_CODE_USE_GITHUB=1.` |
| OpenAI-compatible 원격 | `OPENAI_API_KEY` | `OPENAI_API_KEY is required when CLAUDE_CODE_USE_OPENAI=1 and OPENAI_BASE_URL is not local.` |
| OpenAI-compatible 로컬 | localhost 기반 base URL | API key 없이도 가능 |
| Codex | `CODEX_API_KEY` 또는 auth.json + account id | `Codex auth is required ...`, `Codex auth is missing chatgpt_account_id ...` |
| OpenAI placeholder 키 | `OPENAI_API_KEY=SUA_CHAVE` 금지 | `Invalid OPENAI_API_KEY: placeholder value SUA_CHAVE detected...` |

상세 인증 우선순위는 [인증 / 자격증명 가이드](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md)를 함께 보는 것이 좋다.

---

## 10. 요청 정규화와 transport 결정

OpenAI 계열 요청은 `src/services/api/providerConfig.ts`의 `resolveProviderRequest()` 에서 정규화된다.

이 단계에서 확정되는 값:

- 요청 모델명 `requestedModel`
- 실제 전송 모델명 `resolvedModel`
- transport 종류 `chat_completions` 또는 `codex_responses`
- 최종 base URL
- Codex reasoning effort

transport 결정 규칙:

1. base URL 이 명시적으로 Codex endpoint 이면 `codex_responses`
2. 아니면 모델명이 Codex alias 이면 `codex_responses`
3. 나머지는 `chat_completions`

즉, `codex`는 “어느 API 제품군을 호출하느냐”가 핵심이고, 단순히 브랜드 이름만 다른 것이 아니다.

---

## 11. 새 provider 또는 새 배포 대상을 붙일 때 확인할 순서

### 11.1 새 “런타임 provider”를 추가하는 경우

다음 파일을 순서대로 본다.

1. `src/utils/model/providers.ts`
2. `src/utils/providerFlag.ts`
3. `src/services/api/client.ts`
4. `src/services/api/providerConfig.ts`
5. 필요 시 `src/services/api/openaiShim.ts` 또는 별도 shim
6. `src/entrypoints/cli.tsx`의 초기 입력 검증
7. 정책, bootstrap, MCP, managed settings 등 부가기능 영향 범위 점검

### 11.2 새 “OpenAI-compatible 배포 대상”을 추가하는 경우

다음 순서가 보통 더 맞다.

1. custom `OPENAI_BASE_URL` 과 모델명으로 기존 shim 경로 재사용 가능한지 확인
2. 인증 헤더 형식이 기존 OpenAI-compatible 과 같은지 확인
3. 스트리밍 형식이 `openaiShim.ts`가 처리 가능한지 확인
4. 로컬 provider 로 간주해야 하는지 `isLocalProviderUrl()` 기준 검토
5. 문서와 샘플 설정 추가

대부분의 경우 새 배포 대상은 “새 provider 추가”보다 “기존 OpenAI-compatible 경로 확장”으로 끝난다.

---

## 12. QA와 운영 관점 검증 포인트

### 12.1 공통 검증 포인트

- 환경 변수 조합이 기대한 provider 로 실제 판정되는지
- CLI `--provider` 값과 런타임 provider 결과가 문서와 일치하는지
- 인증 누락 시 초기 검증에서 올바른 메시지가 나오는지
- 로컬 base URL 일 때 불필요한 API key 요구가 사라지는지
- provider 전환 후 bootstrap / policy / managed settings / MCP 부가기능이 예상대로 켜지거나 꺼지는지

### 12.2 OpenAI-compatible 계열 검증 포인트

- `OPENAI_BASE_URL` 변경 시 transport 가 `chat_completions` 로 유지되는지
- Codex alias 입력 시 `codex_responses` 로 바뀌는지
- GitHub Models 모델명이 정규화되는지
- Gemini provider 가 shim 경로를 타더라도 provider 메타데이터는 Gemini 로 집계되는지

### 12.3 Bedrock / Vertex / Foundry 검증 포인트

- SDK 인증 체인이 정상 동작하는지
- 모델 접근 권한 부족 시 provider 특화 오류 메시지가 나오는지
- first-party 전용 부가기능을 잘 건너뛰는지

---

## 13. 운영자가 자주 놓치는 포인트

1. README나 CLI 옵션에 보이는 provider 목록과 내부 런타임 분기 목록은 완전히 같지 않다.
2. “OpenAI provider”라는 표현 아래에 실제로는 OpenAI, Azure, Ollama, LM Studio, OpenRouter, DeepSeek, Together, Groq, Mistral 등 여러 배포가 함께 들어간다.
3. provider 호출이 성공해도 first-party 전용 부가기능은 조용히 비활성화될 수 있다.
4. Codex는 단순 모델명 차이가 아니라 transport 와 인증 경로가 함께 달라진다.
5. local provider 판정 여부가 인증 요구와 보안 판단에 직접 영향을 준다.

---

## 14. 문서 유지보수 기준

다음이 바뀌면 이 문서를 갱신해야 한다.

- `getAPIProvider()` 의 우선순위
- Codex alias 목록
- CLI `--provider` 지원 목록
- OpenAI-compatible 지원 범위 또는 기본 base URL
- first-party 전용 보조 기능의 조건
- 로컬 provider 판정 규칙

같이 갱신하면 좋은 문서:

- [API 가이드](D:/project/openpro/docs/openpro-api-guide-ko.md)
- [인증 / 자격증명 가이드](D:/project/openpro/docs/openpro-auth-credential-guide-ko.md)
- [환경변수 / 설정 키 레퍼런스](D:/project/openpro/docs/openpro-env-settings-reference-ko.md)
- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)
