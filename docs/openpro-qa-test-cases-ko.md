# OpenPro QA 테스트 케이스

## 1. 문서 목적

이 문서는 OpenPro의 핵심 기능을 검증하기 위한 QA 테스트 케이스 모음이다. 상세 기능 정의는 [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)를 따른다.

## 2. 테스트 범위

| 범위 | 포함 내용 |
|---|---|
| 기동/인증 | CLI 시작, provider 검증, 로그인, GitHub onboarding |
| 세션 | 저장, 재개, export, session QR |
| 도구 | 파일 읽기/수정, 셸, 컨텍스트 추가 |
| 권한 | permissions, plan mode, 정책 차단 |
| 메모리 | user/project/local/auto memory |
| 작업 | background tasks, BG sessions, cron scheduling |
| 설정/상태 | status/config/usage/doctor |
| 외부 연동 | IDE, desktop, voice, remote-env |
| 확장 | MCP, plugin, hooks |
| 협업 | review, security-review, pr-comments, install-github-app |

## 3. 테스트 환경 매트릭스

| 축 | 권장 조합 |
|---|---|
| OS | Windows, macOS 또는 Linux |
| 제공자 | OpenAI 호환, Codex, GitHub Models, Ollama |
| 인증 상태 | 미로그인, 로그인 완료 |
| 네트워크 | 정상, 외부 API 차단 |
| 권한 모드 | default, plan, auto |

## 4. 공통 판정 기준

- 정상 케이스는 명령이 기대한 화면 또는 메시지를 반환해야 한다.
- 예외 케이스는 프로세스가 비정상 종료하지 않고 오류 메시지를 반환해야 한다.
- 권한 관련 기능은 승인/거부/정책 차단이 명확히 구분되어야 한다.
- 파일/설정 변경 기능은 저장 후 재기동 시에도 반영 여부를 확인해야 한다.

## 5. 테스트 케이스

### 5.1 기동 및 제공자

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-001 | OpenAI 환경으로 정상 기동 | `CLAUDE_CODE_USE_OPENAI=1`, 유효한 `OPENAI_API_KEY` | 1. `openpro` 실행 | 시작 화면 후 대화 입력 가능 |
| OC-QA-002 | 로컬 base URL에서 API key 없이 기동 | Ollama 또는 로컬 OpenAI 호환 서버 실행 중 | 1. `OPENAI_BASE_URL`을 로컬 주소로 설정 2. `openpro` 실행 | API key 오류 없이 시작 |
| OC-QA-003 | placeholder API key 차단 | `OPENAI_API_KEY=SUA_CHAVE` | 1. `openpro` 실행 | placeholder 경고 후 종료 |
| OC-QA-004 | Codex auth.json 자동 인식 | 유효한 `~/.codex/auth.json` 존재 | 1. Codex provider 설정 2. 기동 | Codex provider로 시작 |
| OC-QA-005 | Codex account id 누락 처리 | auth 파일에서 account id 제거 | 1. `openpro` 실행 | account id 누락 오류 출력 |

### 5.2 로그인 및 GitHub onboarding

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-006 | Claude.ai 로그인 성공 | 인터넷 연결, 로그인 가능한 계정 | 1. `/login` 실행 2. OAuth 완료 | 로그인 성공 후 기능 사용 가능 |
| OC-QA-007 | GitHub Models device flow 성공 | gh 또는 GitHub 브라우저 인증 가능 | 1. `/onboard-github` 2. device flow 선택 | secure storage 저장 및 user settings 갱신 |
| OC-QA-008 | GitHub Models PAT 입력 성공 | 유효한 PAT 보유 | 1. `/onboard-github` 2. PAT 방식 선택 3. 토큰 입력 | 완료 메시지 출력 |
| OC-QA-009 | user settings 구문 오류 시 onboarding 부분 실패 | user settings 손상 상태 | 1. `/onboard-github` 실행 | 토큰 저장 성공, settings 반영 실패 메시지 출력 |

### 5.3 세션 저장 및 재개

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-010 | 세션 로그 생성 확인 | 정상 기동 상태 | 1. 아무 프롬프트나 입력 2. 세션 종료 3. 로그 경로 확인 | `~/.claude/projects/.../*.jsonl` 생성 |
| OC-QA-011 | 같은 프로젝트 세션 재개 | 기존 세션 존재 | 1. `/resume` 실행 2. 세션 선택 | 대화가 정상 재개 |
| OC-QA-012 | 다른 프로젝트 세션 선택 | 다른 프로젝트 세션 존재 | 1. `/resume` 2. 다른 프로젝트 세션 선택 | 재개 명령이 안내되고 클립보드 복사 |
| OC-QA-013 | 직접 session id로 재개 | 유효한 session id 확보 | 1. `/resume <sessionId>` 실행 | 해당 세션 직접 재개 |
| OC-QA-014 | 세션이 없을 때 재개 | 로그 없음 | 1. `/resume` 실행 | `No conversations found to resume` |

### 5.4 Export 및 Session 화면

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-015 | 기본 파일명으로 export | 현재 세션에 사용자 메시지 존재 | 1. `/export` 실행 | 기본 파일명 제안과 저장 가능 |
| OC-QA-016 | 파일명 지정 export | 쓰기 가능한 디렉터리 | 1. `/export mylog` 실행 | `mylog.txt`로 저장 |
| OC-QA-017 | export 실패 처리 | 쓰기 불가 경로 사용 | 1. export 인자로 저장 실패 유도 | 실패 메시지 출력 |
| OC-QA-018 | 원격 모드 아닌 상태에서 session | 로컬 일반 모드 | 1. `/session` 실행 | 원격 모드 안내 메시지 출력 |

### 5.5 파일 및 도구 실행

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-019 | 파일 읽기 도구 사용 | 읽기 가능한 프로젝트 파일 존재 | 1. 파일 설명 요청 | 파일 내용이 읽혀 응답에 반영 |
| OC-QA-020 | 파일 수정 성공 | 쓰기 가능한 파일 존재 | 1. 파일 수정 요청 | 파일 변경 반영 |
| OC-QA-021 | 읽기 전용 파일 수정 실패 | 읽기 전용 파일 준비 | 1. 수정 요청 | 권한 또는 쓰기 실패 메시지 |
| OC-QA-022 | `/add-dir`로 외부 디렉터리 추가 | 외부 디렉터리 준비 | 1. `/add-dir <path>` 실행 | 컨텍스트에 디렉터리 추가 |
| OC-QA-023 | Bash 명령 실패 처리 | 존재하지 않는 명령 사용 | 1. 해당 명령 실행 요청 | stderr 기반 실패 응답 |

### 5.6 권한 및 계획 모드

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-024 | plan mode 진입 | 기본 모드 | 1. `/plan` 실행 | plan mode 활성화 메시지 |
| OC-QA-025 | plan mode 파일 열기 | plan mode 활성화 | 1. `/plan open` 실행 | 계획 파일 열기 또는 표시 |
| OC-QA-026 | 위험 Bash allow rule 제거 | auto mode 활성화 가능 | 1. 위험 allow rule 설정 2. auto mode 진입 | 규칙 제거 또는 비활성화 |
| OC-QA-027 | 정책에 의한 원격 제어 차단 | 정책에서 `allow_remote_control=false` | 1. `openpro remote-control` | 차단 메시지 출력 |

### 5.7 메모리

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-028 | user memory 생성 | 파일 미존재 | 1. `/memory` → user 선택 | `~/.claude/CLAUDE.md` 생성 |
| OC-QA-029 | project memory 생성 | 프로젝트 루트에 파일 없음 | 1. `/memory` → project 선택 | `<cwd>/CLAUDE.md` 생성 |
| OC-QA-030 | local memory 생성 | 로컬 메모리 없음 | 1. `/memory` → local 선택 | `<cwd>/CLAUDE.local.md` 생성 |
| OC-QA-031 | auto-memory 경로 생성 | auto-memory 비어 있음 | 1. 자동 메모리 트리거 수행 | memory/logs 경로 생성 |

### 5.8 백그라운드 작업 및 스케줄링

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-032 | `/tasks` 목록 표시 | 백그라운드 작업 1개 이상 | 1. `/tasks` 실행 | 작업 목록 표시 |
| OC-QA-033 | `/tasks`에서 작업 종료 | running task 존재 | 1. `/tasks` 2. 항목 선택 3. `x` 입력 | 작업 상태 종료 |
| OC-QA-034 | 팀메이트 전경 전환 | teammate task 존재 | 1. `/tasks` 2. teammate 선택 3. `f` | 전경 보기 전환 |
| OC-QA-035 | BG 세션 목록 조회 | `--bg` 실행 세션 존재 | 1. `openpro ps` 실행 | 세션 목록 표시 |
| OC-QA-036 | cron one-shot missed task 확인 | 예약 작업 생성 후 실행 시각 경과 | 1. 앱 재시작 2. 스케줄러 확인 | 사용자 재실행 질의 표시 |

### 5.9 설정, 상태, 진단

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-037 | `/status` 탭 열기 | 정상 상태 | 1. `/status` 실행 | Status 탭 표시 |
| OC-QA-038 | `/config` 탭 열기 | 정상 상태 | 1. `/config` 실행 | Config 탭 표시 |
| OC-QA-039 | `/usage` 탭 열기 | 사용량 조회 가능 | 1. `/usage` 실행 | Usage 탭 표시 |
| OC-QA-040 | `/doctor` 실행 | 진단 가능 환경 | 1. `/doctor` 실행 | Doctor 화면 표시 |
| OC-QA-041 | settings 문법 오류 처리 | settings 파일 손상 | 1. 설정 변경 시도 | 설정 반영 실패 메시지 |

### 5.10 IDE, Desktop, Voice, Remote Environment

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-042 | IDE 연결 성공 | 지원 IDE 설치 및 확장 준비 | 1. `/ide` 실행 2. IDE 선택 | 연결 완료 |
| OC-QA-043 | Desktop 미설치 분기 | Desktop 미설치 | 1. `/desktop` 실행 | 다운로드 여부 질의 |
| OC-QA-044 | Desktop 정상 핸드오프 | Desktop 설치 및 최소 버전 충족 | 1. `/desktop` 실행 | 세션 전환 성공 |
| OC-QA-045 | Voice 활성화 성공 | Claude.ai 로그인, 마이크/도구 정상 | 1. `/voice` 실행 | push-to-talk 안내 |
| OC-QA-046 | Voice 마이크 권한 거부 | 권한 미허용 | 1. `/voice` 실행 | OS 설정 경로 안내 |
| OC-QA-047 | Remote environment 다중 선택 | 원격 환경 2개 이상 | 1. `/remote-env` 실행 2. 환경 선택 | 기본 환경 저장 |

### 5.11 MCP, Plugin, Hooks

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-048 | MCP enable/disable | MCP 서버 정의 존재 | 1. `/mcp disable <server>` 2. `/mcp enable <server>` | 상태 변경 반영 |
| OC-QA-049 | MCP needs-auth 상태 | 인증 없는 HTTP/SSE 서버 | 1. 서버 연결 시도 | `needs-auth` 상태 |
| OC-QA-050 | Plugin enable/disable | 설치된 플러그인 존재 | 1. `/plugin` 2. 상태 변경 | 런타임 반영 |
| OC-QA-051 | Reload plugins | 활성 플러그인 존재 | 1. `/reload-plugins` | 캐시 무효화 후 재로딩 |
| OC-QA-052 | Hook 설정 화면 진입 | 도구 풀 준비 | 1. `/hooks` 실행 | 훅 설정 UI 표시 |

### 5.12 리뷰 및 협업

| ID | 시나리오 | 사전 조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| OC-QA-053 | `/review` 기본 리뷰 | gh auth 완료, PR 존재 | 1. `/review` 실행 | PR 목록 또는 리뷰 결과 표시 |
| OC-QA-054 | `/review <번호>` 직접 리뷰 | 특정 PR 존재 | 1. `/review 123` | 해당 PR 리뷰 실행 |
| OC-QA-055 | `/pr-comments` 댓글 수집 | 댓글이 있는 PR | 1. `/pr-comments` 실행 | PR-level/review comments 출력 |
| OC-QA-056 | `/security-review` 실행 | 변경 사항 존재 | 1. `/security-review` 실행 | 보안 리뷰 보고서 생성 |
| OC-QA-057 | `/install-github-app` 성공 | gh auth 및 repo admin 권한 | 1. `/install-github-app` 진행 | workflow 브랜치/파일 생성 |
| OC-QA-058 | GitHub workflow 중복 오류 | 동일 파일 기존 존재 | 1. 설치 진행 | 수동 업데이트 안내와 함께 실패 |

## 6. 회귀 테스트 우선순위

### 6.1 배포 직전 최소 회귀

- OC-QA-001
- OC-QA-007
- OC-QA-011
- OC-QA-020
- OC-QA-024
- OC-QA-032
- OC-QA-040
- OC-QA-044
- OC-QA-048
- OC-QA-053

### 6.2 권한/보안 변경 시 필수 회귀

- OC-QA-026
- OC-QA-027
- OC-QA-041
- OC-QA-049
- OC-QA-056

## 7. 결함 기록 가이드

결함을 기록할 때는 아래 항목을 반드시 포함한다.

- 테스트 케이스 ID
- 실행 환경
- 사용한 provider와 인증 상태
- 실제 입력값 또는 명령
- 기대 결과와 실제 결과
- 관련 세션 ID 또는 로그 경로

## 8. 연계 문서

- 기능 기준 문서: [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)
- 운영 절차 문서: [openpro-operations-manual-ko.md](D:/project/openpro/docs/openpro-operations-manual-ko.md)
- API/연동 문서: [openpro-api-integration-spec-ko.md](D:/project/openpro/docs/openpro-api-integration-spec-ko.md)
