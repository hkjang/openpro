# OpenPro MCP 운영 가이드

## 1. 문서 목적

이 문서는 OpenPro의 MCP Model Context Protocol 서버를 실제 운영과 유지보수 관점에서 정리한 가이드다.  
설정 파일 위치, scope 우선순위, 연결 상태값, OAuth, 정책 필터, 동적 재연결, doctor 진단 흐름까지 포함해 “MCP 가 왜 안 붙는지”를 소스 기준으로 빠르게 판단할 수 있게 구성했다.

대상 독자:

- MCP 서버를 추가, 제거, 운영하는 개발자
- enterprise 정책과 trust 설정을 관리하는 플랫폼 엔지니어
- MCP 장애를 1차 대응해야 하는 QA, 운영자, DevOps

관련 문서:

- [플러그인 및 훅 추가 가이드](D:/project/openpro/docs/openpro-plugin-hook-guide-ko.md)
- [권한 / 보안 매트릭스](D:/project/openpro/docs/openpro-permission-security-matrix-ko.md)
- [오류 메시지 카탈로그](D:/project/openpro/docs/openpro-error-catalog-ko.md)
- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)

---

## 2. 먼저 이해할 핵심 9가지

1. MCP 설정은 한 군데가 아니라 `enterprise`, `user`, `project`, `local`, `dynamic`, `claudeai` 여러 scope 에서 올 수 있다.
2. `.mcp.json` 은 현재 디렉터리뿐 아니라 상위 디렉터리까지 탐색되며, 더 가까운 디렉터리의 정의가 우선한다.
3. 이름 기반 조회 우선순위는 기본적으로 `enterprise > local > project > user` 다.
4. `getAllMcpConfigs()` 는 여기에 `claude.ai` 커넥터를 가장 낮은 우선순위로 합쳐준다.
5. MCP 연결 상태는 `connected`, `failed`, `needs-auth`, `pending`, `disabled` 다섯 가지로 관리된다.
6. interactive 모드와 print/headless 모드 모두 MCP 를 쓰지만, 연결과 재연결의 구현 세부는 다를 수 있다.
7. claude.ai MCP 는 모든 provider 에서 열리는 것이 아니라 사실상 first-party + OAuth + `user:mcp_servers` scope 가 필요한 별도 경로다.
8. enterprise MCP config 가 활성화되면 사용자 추가 서버를 막는 등 강한 제약이 걸릴 수 있다.
9. `/mcp` 나 `claude mcp doctor` 는 단순 나열이 아니라 상태, policy, approval, health check 를 함께 보여주는 운영 도구다.

---

## 3. 핵심 소스 파일

| 파일 | 역할 | 볼 때 집중할 포인트 |
|---|---|---|
| `src/services/mcp/config.ts` | 설정 로드, 병합, 정책 필터 | scope 우선순위, allow/deny, enterprise 제약 |
| `src/services/mcp/useManageMCPConnections.ts` | interactive 연결 수명주기 | 두 단계 로드, pending 추가, reconnect |
| `src/services/mcp/client.ts` | 실제 MCP 연결 | transport 별 connect 흐름 |
| `src/services/mcp/auth.ts` | MCP OAuth 저장과 갱신 | callback port, token refresh, revocation |
| `src/services/mcp/claudeai.ts` | claude.ai 조직 관리형 MCP 커넥터 | eligibility 조건 |
| `src/services/mcp/doctor.ts` | doctor 진단 보고서 생성 | pending approval, disabled, live check |
| `src/services/mcp/utils.ts` | scope 레이블, 프로젝트 승인 상태 | 파일 경로 설명, approved/rejected/pending |
| `src/cli/handlers/mcp.tsx` | CLI 명령 구현 | list, get, add, remove, doctor, serve |
| `src/cli/print.ts` | headless 제어 채널과 OAuth/토글 처리 | 동적 MCP 제어, reconnect, OAuth control flow |

---

## 4. MCP 설정 소스와 우선순위

## 4.1 scope 종류

OpenPro가 다루는 MCP scope 는 아래와 같다.

| Scope | 의미 | 저장 위치 또는 출처 |
|---|---|---|
| `enterprise` | 조직 강제 설정 | enterprise MCP 파일 |
| `user` | 모든 프로젝트 공통 | 전역 Claude 설정 |
| `project` | 저장소 공유 설정 | `.mcp.json` |
| `local` | 현재 프로젝트의 개인 설정 | 전역 Claude 설정 내부의 project-local 영역 |
| `dynamic` | 실행 중 동적 추가 | CLI/IDE/remote-control 등 런타임 상태 |
| `claudeai` | Claude.ai 조직 커넥터 | 원격 fetch 결과 |

## 4.2 `.mcp.json` 탐색 방식

`getMcpConfigsByScope('project')` 는 현재 디렉터리에서 루트까지 올라가며 `.mcp.json` 을 찾는다.

핵심 규칙:

- 상위 디렉터리부터 순서대로 읽음
- 더 현재 디렉터리에 가까운 `.mcp.json` 이 같은 이름의 서버를 override
- 파일이 없으면 조용히 넘어가지만, malformed file 은 오류로 수집

즉, project scope 는 단일 파일이 아니라 “상위 트리 전체” 개념이다.

## 4.3 이름 조회 우선순위

`getMcpConfigByName()` 기준 우선순위:

1. `enterprise`
2. `local`
3. `project`
4. `user`

주의:

- `dynamic` 와 `claudeai` 는 이 함수만으로 항상 찾는 구조가 아니다.
- `claudeai` 서버는 비동기 fetch 후 별도 머지 경로를 탄다.

## 4.4 전체 병합 우선순위

`getAllMcpConfigs()` 는 다음처럼 동작한다.

1. enterprise exclusive control 여부 확인
2. 일반 Claude Code MCP configs 로드
3. claude.ai MCP fetch
4. 정책 필터 적용
5. 수동 등록 서버와 중복되는 claude.ai connector 를 URL 시그니처 기준으로 제거
6. `claudeai` 를 가장 낮은 우선순위로 merge

즉, 수동 등록 서버가 살아 있으면 claude.ai 쪽 중복 커넥터는 숨기는 방향이다.

---

## 5. 설정 파일과 경로

`describeMcpConfigFilePath()` 기준 대표 표기:

| Scope | 사용자에게 보여주는 경로 의미 |
|---|---|
| `user` | 전역 Claude 설정 파일 |
| `project` | `{cwd}/.mcp.json` |
| `local` | 전역 Claude 설정 파일의 project-local 영역 |
| `dynamic` | 동적으로 구성됨 |
| `enterprise` | enterprise MCP 파일 |
| `claudeai` | `claude.ai` |

운영 포인트:

- `project` 는 실제로 상위 디렉터리 traversal 이 있지만, 수정 시점에는 현재 작업 디렉터리의 `.mcp.json` 을 대상으로 본다.
- `local` 은 파일 위치가 프로젝트 안이 아니라 전역 설정 아래에 있으므로, “repo 에 안 보이는데 적용되는 MCP” 가 생길 수 있다.

---

## 6. transport 종류

사용자 설정으로 직접 추가하는 transport 는 보통 아래 셋이다.

- `stdio`
- `sse`
- `http`

내부적으로는 아래 타입도 등장한다.

- `claudeai-proxy`
- `sdk`
- `sse-ide`
- `ws-ide`

운영 시 주의할 점:

- `sdk`, `claudeai-proxy`, IDE 전용 타입은 일반 사용자 추가 대상이라기보다 내부 연결 타입이다.
- doctor 나 UI 목록에는 보일 수 있지만 add/remove 시 기대 동작은 일반 transport 와 다를 수 있다.

---

## 7. 연결 상태 모델

`src/services/mcp/types.ts` 기준 MCP 연결 상태는 아래 다섯 가지다.

| 상태 | 의미 | 운영 해석 |
|---|---|---|
| `connected` | 정상 연결됨 | tools/commands/resources 사용 가능 |
| `failed` | 연결 시도 실패 | 재연결 또는 설정 수정 필요 |
| `needs-auth` | 인증 필요 | OAuth 또는 token 문제 |
| `pending` | 아직 연결 시도 전 또는 재연결 대기 중 | 초기 로드, reconnect backoff, 사용자 승인 대기와 함께 볼 것 |
| `disabled` | 사용자가 비활성화함 | 자동 연결하지 않음 |

doctor 결과에는 추가로 `skipped` 가 있을 수 있다.  
이는 “시도하지 않은 상태”를 진단 보고서에서 표현하기 위한 값이다.

---

## 8. interactive 연결 수명주기

`useManageMCPConnections()` 는 interactive 모드의 중심이다.

큰 흐름:

1. authVersion, plugin reconnect key, dynamic config 변화를 감시
2. claude.ai fetch promise 를 먼저 시작
3. Claude Code configs 를 먼저 로드
4. disabled 서버를 제외하고 Phase 1 연결 시작
5. 이어서 claude.ai configs 를 await
6. 정책 필터와 dedup 적용
7. 새 claude.ai 서버를 UI 에 `pending` 으로 먼저 표시
8. enabled claude.ai 서버를 다시 연결 시작
9. 상태 업데이트는 16ms batch window 로 모아서 AppState 에 반영

이 구조 덕분에:

- 느린 claude.ai fetch 가 전체 MCP 초기화를 막지 않음
- UI 는 서버를 먼저 보여주고, 연결은 뒤에서 진행할 수 있음

---

## 9. approval, disable, policy

## 9.1 project MCP 승인 상태

`getProjectMcpServerStatus()` 는 project scope 서버에 대해 아래 상태를 낸다.

- `approved`
- `rejected`
- `pending`

결정에 쓰이는 값:

- `disabledMcpjsonServers`
- `enabledMcpjsonServers`
- `enableAllProjectMcpServers`
- bypass permissions 관련 설정
- non-interactive session 여부

즉, project MCP 는 단순히 파일에 있다고 바로 연결되는 것이 아니라, 사용자 승인과 설정 source enable 상태를 함께 본다.

## 9.2 disable 저장 방식

`setMcpServerEnabled()` 의 동작은 두 갈래다.

- 기본 disabled builtin 서버는 `enabledMcpServers` 목록으로 opt-in
- 일반 서버는 `disabledMcpServers` 목록으로 opt-out

즉, disable 상태는 서버 종류에 따라 반대로 저장될 수 있다.

## 9.3 enterprise 제약

대표 제약:

- enterprise MCP config 가 있으면 사용자 add/remove 를 막을 수 있음
- 명시적 denylist 에 걸리면 추가 불가
- allowlist 에 없으면 추가 불가
- `allowManagedMcpServersOnly` 같은 managed policy 와 충돌 가능

운영자는 “왜 add 가 안 되는지”를 볼 때 로컬 설정만 보지 말고 enterprise control 여부를 먼저 봐야 한다.

---

## 10. claude.ai MCP eligibility

`fetchClaudeAIMcpConfigsIfEligible()` 는 아래 조건을 모두 통과해야 동작한다.

1. 현재 provider 가 `firstParty`
2. `ENABLE_CLAUDEAI_MCP_SERVERS` 가 명시적 false 가 아님
3. Claude.ai OAuth access token 존재
4. OAuth scope 에 `user:mcp_servers` 포함

그 후:

- `/v1/mcp_servers?limit=1000` 호출
- `claude.ai <display_name>` 형식으로 이름 생성
- normalize name 충돌 시 `(2)`, `(3)` suffix 추가
- `scope: 'claudeai'`, `type: 'claudeai-proxy'` 로 등록

즉, claude.ai MCP 는 “설정 파일에 적는 서버”라기보다 “원격 조직 관리 커넥터”다.

---

## 11. OAuth 운영 포인트

`src/services/mcp/auth.ts` 는 단순 access token 저장기가 아니라 꽤 복잡한 OAuth orchestration 층이다.

핵심 기능:

- metadata discovery
- callback server 실행
- state 검증과 CSRF 방지
- token refresh
- refresh 실패 사유 분류
- token revocation
- secure storage 저장
- XAA cross-app access 흐름

대표 운영 포인트:

- callback port 는 미리 지정할 수도 있고, 사용 가능한 포트를 자동 찾을 수도 있다.
- 일부 OAuth 서버는 200 응답 본문에 에러를 넣으므로 body 정규화가 필요하다.
- Slack 류의 non-standard invalid_grant 는 별도 alias 정규화를 한다.
- remove 시 HTTP/SSE 서버 토큰과 client config 를 secure storage 에서 함께 지운다.

---

## 12. CLI 운영 명령

`src/cli/handlers/mcp.tsx` 기준 대표 명령:

| 명령 | 역할 |
|---|---|
| `claude mcp doctor` | 설정과 live health 를 함께 진단 |
| `claude mcp list` | 전체 서버와 health 상태 출력 |
| `claude mcp get <name>` | 특정 서버 상세 확인 |
| `claude mcp add ...` | 서버 추가 |
| `claude mcp remove ...` | 서버 제거 |
| `claude mcp serve` | MCP 서버 엔트리포인트 기동 |
| `claude mcp add-from-claude-desktop` | Claude Desktop 설정 import |

실무 팁:

- 장애 분류는 `doctor` 가 가장 빠르다.
- `list` 는 “무엇이 있는지” 확인에 좋고
- `get` 은 transport, URL, OAuth 설정 확인에 좋다.

---

## 13. doctor 보고서 해석

`doctor` 는 단순 health check 가 아니라 definition 과 live state 를 함께 본다.

대표 판단 요소:

- runtimeActive 여부
- pending project approval 여부
- disabled 여부
- validation error
- live check 결과

따라서 `failed` 와 `pending approval` 은 전혀 다른 범주다.

주요 해석 예:

- `pending`: 프로젝트 승인 전이라 아직 연결을 시도하지 않음
- `disabled`: 사용자가 꺼 둔 상태
- `needs-auth`: 구성은 맞지만 인증 필요
- `failed`: 실제 연결이 시도되었으나 실패

---

## 14. headless / print 제어 채널에서의 MCP

`src/cli/print.ts` 에서는 MCP가 제어 메시지와 함께 더 동적으로 다뤄진다.

주요 기능:

- 서버 토글
- reconnect
- OAuth flow 시작 및 manual callback 처리
- 동적 MCP 서버 세트 갱신
- pending SDK clients 업그레이드
- control channel 에서 `Server not found` 응답 반환

즉, IDE/remote-control/headless 경로에서는 MCP 가 단순 고정 설정이 아니라 런타임 제어 대상이 된다.

---

## 15. 운영자가 자주 놓치는 포인트

1. `.mcp.json` 에 추가했다고 바로 연결되는 것이 아니라 approval 과 disabled 상태를 함께 본다.
2. claude.ai MCP 는 모든 provider 에서 보이는 기능이 아니다.
3. user/local/project scope 는 이름이 같아도 우선순위가 다르다.
4. `failed` 와 `needs-auth` 는 원인도 대응도 다르다.
5. remove 시 config 만 지우는 게 아니라 secure storage 정리까지 함께 필요할 수 있다.
6. enterprise MCP config 가 존재하면 사용자 쪽 설정이 무시되거나 막힐 수 있다.
7. plugin reload 와 authVersion 변경은 MCP 재연결 트리거가 될 수 있다.

---

## 16. QA 테스트 포인트

### 16.1 설정 병합

- 상위/하위 `.mcp.json` 충돌 시 더 가까운 디렉터리가 이기는지
- `enterprise > local > project > user` 이름 조회 우선순위가 맞는지
- claude.ai connector 가 수동 동일 서버와 중복 노출되지 않는지

### 16.2 상태 전이

- `pending -> connected`
- `pending -> needs-auth`
- `connected -> disabled`
- `failed -> reconnect -> connected`

### 16.3 OAuth

- callback port 지정/자동 탐색이 모두 동작하는지
- token revocation 후 재인증이 필요한지
- `needs-auth` 가 `connected` 로 전이되는지

### 16.4 정책

- enterprise config 활성 시 add 차단
- allowlist / denylist 적용
- project MCP pending approval 상태 반영

---

## 17. 문서 유지보수 기준

다음이 바뀌면 이 문서를 갱신해야 한다.

- MCP scope 우선순위
- transport 종류와 추가 방식
- claude.ai eligibility 조건
- OAuth 저장과 refresh 규칙
- doctor 결과 상태 모델
- disabled/pending/approval 저장 방식

함께 갱신하면 좋은 문서:

- [권한 / 보안 매트릭스](D:/project/openpro/docs/openpro-permission-security-matrix-ko.md)
- [오류 메시지 카탈로그](D:/project/openpro/docs/openpro-error-catalog-ko.md)
- [트러블슈팅 가이드](D:/project/openpro/docs/openpro-troubleshooting-guide-ko.md)
