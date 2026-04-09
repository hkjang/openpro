# OpenPro 한국어 개요

## 1. OpenPro란 무엇인가

OpenPro는 터미널에서 사용하는 오픈소스 코딩 에이전트 CLI다. 하나의 인터페이스 안에서 여러 모델 제공자를 바꿔 쓰면서도 같은 작업 방식으로 코드를 읽고, 수정하고, 명령을 실행하고, 외부 도구와 연동할 수 있다.

핵심 특징은 다음과 같다.

- 여러 모델 제공자 지원
- 파일/셸/검색/에이전트/작업/MCP 도구 통합
- 세션 저장과 재개
- 권한 제어와 계획 모드
- IDE, Desktop, 음성, 원격 환경 연동
- 플러그인과 스킬 기반 확장

## 2. 누가 쓰는가

| 사용자 | 주 활용 방식 |
|---|---|
| 개발자 | 코드 이해, 수정, 리뷰, 자동화 작업 |
| QA | 테스트 시나리오 검증, 회귀 점검 |
| 운영자 | 설정, 권한, MCP, 플러그인, 원격 기능 운영 |
| 고객지원 | 로그인 실패, 세션 재개, 연동 문제 응대 |

## 3. 가장 먼저 알아야 할 명령

| 명령 | 용도 |
|---|---|
| `/provider` | 모델 제공자 설정 |
| `/login` | Claude.ai 로그인 |
| `/onboard-github` | GitHub Models 설정 |
| `/resume` | 이전 세션 재개 |
| `/memory` | 메모리 파일 편집 |
| `/tasks` | 백그라운드 작업 확인 |
| `/config` | 설정 화면 열기 |
| `/doctor` | 환경 진단 |
| `/mcp` | MCP 서버 관리 |
| `/plugin` | 플러그인 관리 |

## 4. 일반적인 사용 흐름

### 4.1 처음 시작할 때

1. `openpro` 실행
2. `/provider`로 모델 설정
3. 필요하면 `/login` 또는 `/onboard-github`
4. 자연어로 작업 지시

### 4.2 작업 중 자주 하는 일

1. 파일을 읽고 수정한다.
2. 필요한 셸 명령을 실행한다.
3. 긴 작업은 백그라운드로 보낸다.
4. 세션을 저장하고 다시 재개한다.

### 4.3 문제가 생기면

1. `/doctor`로 환경 점검
2. `/config` 또는 `/permissions` 점검
3. 세션 로그와 오류 메시지 확인

## 5. 기능 구조를 한 번에 보면

| 기능군 | 설명 |
|---|---|
| 기동/인증 | 실행, 로그인, provider 검증 |
| 대화/세션 | 프롬프트, 세션 저장, 재개, export |
| 도구 실행 | 파일 읽기/수정, 셸, 웹, 에이전트 |
| 권한/안전 | 승인, 정책, 계획 모드 |
| 메모리 | 사용자/프로젝트 장기 컨텍스트 |
| 작업/스케줄링 | 백그라운드 작업, BG 세션, cron |
| 설정/상태 | status, config, usage, doctor |
| 외부 연동 | IDE, Desktop, Voice, Remote env |
| 확장 | MCP, plugin, hooks, skills |
| 협업 | review, security-review, GitHub Actions |

## 6. 어떤 문서를 봐야 하는가

| 목적 | 추천 문서 |
|---|---|
| 전체 기능을 자세히 알고 싶을 때 | [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md) |
| 실제 운영 절차가 필요할 때 | [openpro-operations-manual-ko.md](D:/project/openpro/docs/openpro-operations-manual-ko.md) |
| 테스트 케이스가 필요할 때 | [openpro-qa-test-cases-ko.md](D:/project/openpro/docs/openpro-qa-test-cases-ko.md) |
| API/외부 연동만 보고 싶을 때 | [openpro-api-integration-spec-ko.md](D:/project/openpro/docs/openpro-api-integration-spec-ko.md) |
| 화면 단위로 보고 싶을 때 | [openpro-screen-spec-ko.md](D:/project/openpro/docs/openpro-screen-spec-ko.md) |
| 전체 문서 인덱스가 필요할 때 | [openpro-docs-index-ko.md](D:/project/openpro/docs/openpro-docs-index-ko.md) |

## 7. 빠른 운영 체크

- 실행이 안 되면 provider env를 먼저 확인한다.
- 음성이 안 되면 `/login`, 마이크 권한, 녹음 도구를 확인한다.
- 세션이 안 보이면 현재 프로젝트 경로와 `~/.claude/projects` 로그를 확인한다.
- 원격 기능이 안 되면 로그인 상태와 조직 정책을 확인한다.
- GitHub 기능이 안 되면 `gh auth`와 repository 권한을 확인한다.
