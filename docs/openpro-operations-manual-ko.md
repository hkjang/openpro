# OpenPro 운영 매뉴얼

## 1. 문서 목적

이 문서는 OpenPro를 실제로 사용하는 개발자, 운영자, 고객지원 담당자가 일상 운영과 장애 대응에 바로 활용할 수 있도록 작성한 한국어 운영 매뉴얼이다. 설계 관점의 상세 기능 설명은 [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)를 기준으로 하고, 본 문서는 실제 사용 절차와 점검 순서를 중심으로 정리한다.

## 2. 대상 독자

| 독자 | 주 사용 목적 |
|---|---|
| 개발자 | 프로젝트에서 OpenPro를 실행하고 코드 작업에 활용 |
| 운영자 | 제공자 설정, 권한 모드, MCP/플러그인, 원격 기능 운영 |
| QA | 기능 검증 준비, 재현 절차 확인 |
| 고객지원 | 로그인 실패, 세션 재개 실패, 음성/데스크톱 문제 응대 |

## 3. 운영 전 기본 체크리스트

### 3.1 공통 체크

- Node.js 20 이상 또는 Bun 사용 가능 여부 확인
- 현재 작업 디렉터리가 올바른 프로젝트 루트인지 확인
- 모델 제공자 인증 정보 준비 여부 확인
- `gh` CLI가 필요한 기능을 쓸 경우 로그인 여부 확인
- 읽기/쓰기 권한이 필요한 디렉터리에 접근 가능한지 확인

### 3.2 권장 사전 점검 명령

```powershell
openpro --version
bun run doctor:runtime
bun run hardening:check
```

### 3.3 성공 기준

| 항목 | 성공 기준 |
|---|---|
| CLI 시작 | 시작 화면 후 대화 입력 가능 |
| 제공자 검증 | API key 또는 로컬 제공자 설정 오류 없음 |
| 세션 저장 | `~/.claude/projects/...` 아래 로그 생성 |
| 기본 도구 | 파일 읽기, 셸 실행, 세션 재개 가능 |

## 4. 일상 운영 절차

### 4.1 처음 실행할 때

1. 저장소 루트에서 `openpro` 또는 `bun run dev`를 실행한다.
2. 즉시 종료되면 환경 변수와 제공자 설정을 먼저 확인한다.
3. 기본 제공자 설정이 없으면 `/provider`를 실행한다.
4. GitHub Models를 사용할 경우 `/onboard-github`를 실행한다.
5. Claude.ai 계정 기반 기능을 사용할 경우 `/login`을 실행한다.

### 4.2 모델 제공자 설정 순서

| 상황 | 권장 절차 |
|---|---|
| OpenAI API 사용 | `/provider` → OpenAI 호환 선택 → API key/base URL/model 입력 |
| Codex 사용 | `/provider` → Codex 선택 → `~/.codex/auth.json` 또는 `CODEX_API_KEY` 확인 |
| 로컬 Ollama 사용 | Ollama 실행 확인 → `/provider` → Ollama 선택 |
| GitHub Models 사용 | `/onboard-github` → device code 또는 PAT 입력 |

### 4.3 기본 대화 운영

1. 현재 작업 목표를 자연어로 입력한다.
2. 파일 탐색이 필요하면 `/files`, `/context`, `/add-dir`를 사용한다.
3. 세부 변경 내역을 보고 싶으면 `/diff`를 사용한다.
4. 대화 길이가 길어지면 `/compact`를 사용한다.
5. 세션을 종료하기 전 중요한 상태라면 `/export` 또는 `/tag`, `/rename`을 사용한다.

### 4.4 이전 작업 이어서 하기

1. 같은 프로젝트에서 `/resume`을 실행한다.
2. 세션 목록에서 원하는 대화를 선택한다.
3. 다른 프로젝트 세션이면 복사된 재개 명령을 해당 경로에서 실행한다.

## 5. 자주 쓰는 운영 시나리오

### 5.1 세션 재개

| 단계 | 수행 내용 | 확인 포인트 |
|---|---|---|
| 1 | `/resume` 실행 | 세션 목록이 표시되는지 확인 |
| 2 | 원하는 세션 선택 | 현재 디렉터리와 같은 프로젝트인지 확인 |
| 3 | 재개 완료 | 직전 대화 맥락과 작업 상태가 복원되는지 확인 |

### 5.2 메모리 파일 관리

| 상황 | 조치 |
|---|---|
| 프로젝트 규칙을 지속 저장하고 싶을 때 | `/memory` → project 메모리 선택 |
| 개인 선호를 저장하고 싶을 때 | `/memory` → user 메모리 선택 |
| 로컬 환경 전용 설정을 남길 때 | `/memory` → local 메모리 선택 |

### 5.3 위험 명령 실행 전 확인

1. 현재 permission mode가 무엇인지 확인한다.
2. `/permissions`에서 allow/deny rule을 확인한다.
3. 자동 모드 사용 시 과도한 wildcard 또는 인터프리터 허용 규칙이 없는지 확인한다.
4. 민감 작업은 승인 대화상자를 통해 허용 여부를 다시 검토한다.

### 5.4 백그라운드 작업 운영

| 작업 | 운영 방법 |
|---|---|
| 실행 중 작업 확인 | `/tasks` |
| 작업 상세 보기 | 목록에서 Enter |
| 작업 중지 | 목록 또는 상세에서 `x` |
| 팀메이트 전경 전환 | `f` |
| 백그라운드 세션 목록 | `openpro ps` |
| 세션 로그 보기 | `openpro logs <id>` |

### 5.5 IDE 연결

1. `/ide`를 실행한다.
2. 감지된 IDE 목록을 확인한다.
3. 현재 프로젝트 경로와 맞는 IDE를 선택한다.
4. 연결 실패 시 IDE 확장 설치 여부와 경로 일치 여부를 확인한다.

### 5.6 Desktop으로 넘기기

1. `/desktop` 실행
2. 설치 상태 확인
3. 미설치 또는 구버전이면 다운로드 진행
4. 정상 버전이면 세션 flush 후 Desktop으로 전환

### 5.7 음성 모드 켜기

1. `/login`으로 Claude.ai 로그인 상태를 확인한다.
2. `/voice` 실행
3. 마이크 권한 요청이 뜨면 허용한다.
4. 녹음 도구가 없다는 메시지가 나오면 SoX 또는 안내된 도구를 설치한다.

## 6. 운영자용 설정 관리

### 6.1 설정 변경 우선순위

| 설정 소스 | 설명 | 운영 유의사항 |
|---|---|---|
| user | 사용자 전역 설정 | 여러 프로젝트에 공통 적용 |
| project | 프로젝트 공통 설정 | 팀 표준 반영에 적합 |
| local | 로컬 환경 전용 설정 | 개인 실험용으로 적합 |
| managed | 관리형 설정 | 사용자가 직접 덮어쓰지 못할 수 있음 |

### 6.2 반드시 확인할 설정 항목

- 모델 제공자 관련 환경 값
- `voiceEnabled`
- `remote.defaultEnvironmentId`
- 플러그인 enable/disable 상태
- MCP 서버 enable/disable 상태
- 권한 규칙과 자동 모드 사용 여부

### 6.3 설정 파일 손상 대응

| 증상 | 대응 |
|---|---|
| 설정 저장 실패 메시지 | 설정 파일 구문 오류 확인 |
| CLI 시작 시 경고 출력 | `~/.claude/backups/` 백업본 존재 여부 확인 |
| 일부 설정만 적용 안 됨 | source 우선순위 충돌 여부 확인 |

## 7. 지원팀 장애 대응 가이드

### 7.1 로그인/인증 문제

| 증상 | 원인 후보 | 1차 대응 |
|---|---|---|
| `OPENAI_API_KEY is required` | API key 누락 | 환경 변수 또는 `/provider` 재설정 |
| Codex auth 누락 | `auth.json` 없음 또는 `CODEX_API_KEY` 없음 | Codex 로그인 재실행 또는 env 재설정 |
| Voice login 요구 | Claude.ai 미로그인 | `/login` 안내 |
| GitHub Models 동작 안 함 | secure storage 저장 실패 또는 user settings 반영 실패 | `/onboard-github` 재실행 |

### 7.2 세션/로그 문제

| 증상 | 원인 후보 | 1차 대응 |
|---|---|---|
| `/resume` 목록 비어 있음 | 세션 로그 없음 | 다른 프로젝트인지 확인 |
| 세션은 있는데 재개 실패 | 손상된 로그 또는 UUID 문제 | 직접 session id로 재시도 |
| export 실패 | 경로 쓰기 권한 부족 | 다른 파일명/경로로 재시도 |

### 7.3 음성/클라이언트 연동 문제

| 증상 | 원인 후보 | 1차 대응 |
|---|---|---|
| `/voice` 실행 시 권한 거부 | 마이크 OS 권한 없음 | 운영체제 마이크 설정 안내 |
| `/desktop` 실패 | 앱 미설치 또는 구버전 | 다운로드 또는 업데이트 안내 |
| `/ide` 연결 안 됨 | IDE 확장 미설치, 경로 불일치 | 현재 프로젝트를 여는 IDE인지 확인 |

### 7.4 원격/MCP 문제

| 증상 | 원인 후보 | 1차 대응 |
|---|---|---|
| `/remote-env` 오류 | 로그인 세션 문제 또는 원격 환경 없음 | 로그인 상태 재확인 |
| `needs-auth` | MCP 인증 누락 | OAuth/headers 설정 재검토 |
| `remote-control` 거부 | 조직 정책 차단 | 정책 관리자 확인 필요 |

## 8. 운영 점검 체크리스트

### 8.1 일일 점검

- CLI 기동 가능 여부
- 주 사용 제공자 인증 만료 여부
- 세션 로그 저장 여부
- 필수 MCP 서버 연결 상태
- 주요 플러그인 활성 상태

### 8.2 배포 전 점검

- `bun run doctor:runtime`
- `bun run hardening:check`
- `/review` 또는 `/security-review` 가능 여부
- `/tasks`와 BG 세션 기능 정상 여부
- 설정 파일 변경 후 재기동 반영 여부

### 8.3 장애 발생 시 수집 항목

| 수집 항목 | 수집 방법 |
|---|---|
| 실행 명령 | 사용자가 입력한 명령 재확인 |
| 오류 메시지 원문 | 터미널 출력 복사 |
| 세션 ID | 세션 로그 파일명 또는 `/resume` 목록 확인 |
| provider 설정 | `/provider` 상태, 관련 env |
| 관련 로그 | `~/.claude/projects/...` 하위 JSONL |

## 9. 고객지원 응답 템플릿

### 9.1 제공자 인증 오류

`현재 메시지는 모델 제공자 인증 정보가 설정되지 않았을 때 발생합니다. 먼저 /provider 로 제공자를 다시 설정해 주세요. OpenAI 호환 서버를 쓰는 경우에는 OPENAI_API_KEY 가 필요하고, Codex 를 쓰는 경우에는 ~/.codex/auth.json 또는 CODEX_API_KEY 가 필요합니다.`

### 9.2 음성 모드 오류

`Voice 기능은 Claude.ai 로그인, 마이크 권한, 녹음 도구 설치가 모두 필요합니다. 먼저 /login 으로 로그인 상태를 확인한 뒤 /voice 를 다시 실행해 주세요. 마이크 권한이 거부된 경우에는 운영체제의 개인정보 보호 설정에서 마이크 권한을 허용해야 합니다.`

### 9.3 데스크톱 전환 실패

`/desktop 은 Claude Desktop 이 설치되어 있고 최소 버전 이상이어야 정상 동작합니다. 설치가 없거나 버전이 낮으면 다운로드 안내가 표시됩니다. 설치 후 다시 /desktop 을 실행해 주세요.`

## 10. 연계 문서

- 설계 기준 문서: [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)
- QA 검증 문서: [openpro-qa-test-cases-ko.md](D:/project/openpro/docs/openpro-qa-test-cases-ko.md)
- API/연동 문서: [openpro-api-integration-spec-ko.md](D:/project/openpro/docs/openpro-api-integration-spec-ko.md)
