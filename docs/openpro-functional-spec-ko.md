# OpenPro 한국어 종합 기능 명세서

## 1. 문서 기본 정보

| 항목 | 내용 |
|---|---|
| 문서 목적 | OpenPro에 포함된 사용자 기능, 운영 기능, 관리자성 설정 기능, 연동 기능, 자동화 기능을 개발·QA·운영·지원이 바로 활용할 수 있는 수준으로 정리한다. |
| 기준 버전 | `@hkjang/openpro` `0.1.9` |
| 기준 소스 | `src/entrypoints/cli.tsx`, `src/commands.ts`, `src/tools.ts`, `src/utils/config.ts`, `src/utils/sessionStorage.ts`, `src/utils/permissions/permissionSetup.ts`, `src/utils/cronTasks.ts`, `src/utils/cronScheduler.ts`, `src/services/api/*`, `src/services/mcp/*` |
| 문서 범위 | 터미널 사용자 기능, 설정 화면, 세션 관리, 권한 제어, 모델 제공자 설정, 파일/명령 실행, 메모리, 백그라운드 작업, 스케줄링, MCP, 플러그인, IDE/데스크톱/원격 연동, GitHub/Slack 연동, 로그·분석·진단 |
| 제외 범위 | 저장소 외부 인프라의 상세 운영 절차, 벤더별 과금 정책, 비공개 서비스의 서버 내부 구현 |
| 문서 원칙 | 현재 코드 기준 동작을 우선 기술하며, 빌드 플래그 또는 내부 빌드 전용 기능은 별도 표기한다. |

## 1.1 연계 문서

- 운영 절차 문서: [openpro-operations-manual-ko.md](D:/project/openpro/docs/openpro-operations-manual-ko.md)
- QA 테스트 문서: [openpro-qa-test-cases-ko.md](D:/project/openpro/docs/openpro-qa-test-cases-ko.md)
- API 및 연동 문서: [openpro-api-integration-spec-ko.md](D:/project/openpro/docs/openpro-api-integration-spec-ko.md)

## 2. 시스템 개요

OpenPro는 터미널 기반 인공지능 코딩 에이전트다. 사용자는 자연어 프롬프트와 슬래시 명령을 통해 코드 설명, 파일 수정, 셸 명령 실행, 외부 도구 호출, 세션 재개, 배경 작업 관리, 원격 세션 연동을 수행할 수 있다. 시스템은 단일 대화형 인터페이스 안에서 다음 계층을 통합한다.

| 계층 | 역할 |
|---|---|
| 실행 계층 | CLI 기동, 서브커맨드 분기, 백그라운드 세션, 데몬, 원격 제어 브리지 |
| 대화 계층 | 프롬프트 처리, 응답 스트리밍, 세션 저장, 대화 재개, 복사·내보내기 |
| 도구 계층 | 파일 읽기/수정/쓰기, 셸, 검색, 웹 연동, 서브 에이전트, 작업 관리 |
| 정책 계층 | 권한 모드, 위험 명령 차단, 조직 정책, 인증 상태, 샌드박스 |
| 확장 계층 | MCP 서버, 플러그인, 스킬, IDE 연결, GitHub/Slack/브라우저/데스크톱 연동 |
| 운영 계층 | 진단, 사용량, 비용, 로그, 분석, 설정, 백업, 배치/스케줄링 |

## 3. 사용자 유형 및 권한 모델

### 3.1 사용자 유형

| 사용자 유형 | 설명 | 대표 기능 |
|---|---|---|
| 일반 로컬 사용자 | 로컬 프로젝트에서 OpenPro를 사용하는 기본 사용자 | 대화, 파일 수정, 셸 실행, `/resume`, `/memory`, `/export` |
| 인증 사용자 | Claude.ai 또는 GitHub Models 인증을 완료한 사용자 | `/login`, `/voice`, 원격 기능, GitHub Models 사용 |
| 프로젝트 운영자 | 프로젝트 설정, 플러그인, MCP, 권한 규칙을 조정하는 사용자 | `/config`, `/permissions`, `/mcp`, `/plugin`, `/hooks` |
| 저장소 관리자 | GitHub Actions, Slack 앱, 보안 리뷰 흐름을 운영하는 사용자 | `/install-github-app`, `/install-slack-app`, `/security-review` |
| 조직 정책 관리자 | 조직 정책으로 원격 제어, 권한 우회, 기타 제한을 제어하는 상위 권한자 | 정책 로딩 후 기능 허용/차단 |
| 내부 빌드 운영자 | feature flag, ant 전용 기능, 원격 정밀 리뷰, 홈스페이스 분석을 사용하는 내부 사용자 | `ultrareview`, `daemon`, `bridge`, `templates`, `insights` 일부 |

### 3.2 권한 판정 축

OpenPro의 실제 접근 제어는 단일 역할 기반이 아니라 아래 축의 조합으로 결정된다.

| 권한 축 | 설명 |
|---|---|
| 운영체제 파일 권한 | 읽기/쓰기 가능 경로, 홈 디렉터리 접근 여부, 외부 편집기 호출 가능 여부 |
| 앱 권한 모드 | `default`, `plan`, `auto`, 우회 모드, 사용자 허용/거부 규칙 |
| 인증 상태 | Claude.ai 로그인, GitHub Models 토큰, Codex 인증, MCP OAuth 상태 |
| 조직 정책 | 원격 제어 허용 여부, 위험 기능 비활성화 여부 |
| 설정 소스 우선순위 | user, project, local, managed 등 설정 출처에 따라 최종 값이 달라짐 |
| 빌드 플래그 | 외부 빌드에는 숨겨지고 내부 빌드에서만 열리는 기능 존재 |

### 3.3 주요 상태값

| 영역 | 상태값 |
|---|---|
| 권한 모드 | `default`, `plan`, `auto`, `bypassPermissions` 계열 |
| 작업 상태 | `pending`, `running`, `completed`, `failed`, `killed` 성격의 상태 |
| MCP 연결 상태 | `connected`, `failed`, `needs-auth`, `pending`, `disabled` |
| 데스크톱 핸드오프 상태 | `checking`, `prompt-download`, `flushing`, `opening`, `success`, `error` |
| 원격 환경 선택 상태 | `loading`, `updating`, `null` |
| 세션 선택 결과 | 동일 프로젝트 재개, 동일 저장소 다른 워크트리 재개, 교차 프로젝트 재개 불가 후 명령 복사 |
| 제공자 전송 방식 | `chat_completions`, `codex_responses` |

## 4. 데이터 저장 구조

| 저장 대상 | 경로/형식 | 설명 |
|---|---|---|
| 전역 설정 | `~/.claude` 계열 설정 파일 | 사용자 공통 설정, 테마, 알림, MCP/플러그인 설정, 백업 메타데이터 |
| 설정 백업 | `~/.claude/backups/` | 설정 손상 시 백업본 보관 |
| 사용자 메모리 | `~/.claude/CLAUDE.md` | 사용자 전역 메모리 |
| 프로젝트 메모리 | `<cwd>/CLAUDE.md` | 프로젝트 공통 메모리 |
| 로컬 메모리 | `<cwd>/CLAUDE.local.md` | 로컬 전용 메모리 |
| 자동 메모리 엔트리 | `<memoryBase>/projects/<sanitized-git-root>/memory/MEMORY.md` | 자동 메모리 진입 파일 |
| 자동 메모리 일일 로그 | `<memoryBase>/projects/<sanitized-git-root>/memory/logs/YYYY/MM/YYYY-MM-DD.md` | 날짜별 축적 기록 |
| 세션 로그 | `~/.claude/projects/<sanitized-project>/<sessionId>.jsonl` | 주 대화 로그 |
| 서브에이전트 로그 | `~/.claude/projects/<sanitized-project>/<sessionId>/subagents/.../agent-<id>.jsonl` | 서브 에이전트 대화 로그 |
| 원격 에이전트 메타 | `~/.claude/projects/<sanitized-project>/<sessionId>/remote-agents/*.meta.json` | 원격 작업 메타 정보 |
| 제공자 프로필 | `.openpro-profile.json` | 프로젝트/실행 디렉터리 기준 제공자 프로필 |
| 평문 자격 증명 대체 저장소 | `~/.claude/.credentials.json` | macOS 이외 등에서 secure storage 대체 저장소로 사용 가능 |
| GitHub Models 토큰 | OS secure storage, 대체 시 평문 저장 | GitHub Models 인증 정보 |
| 예약 작업 파일 | `<project>/.claude/scheduled_tasks.json` | cron 기반 예약 작업 정의 |

## 5. 기능 카탈로그

| 기능군 | 주요 명령/진입점 | 주 대상 |
|---|---|---|
| 기동 및 라우팅 | `openpro`, `--version`, `daemon`, `remote-control`, `ps/logs/attach/kill`, `--bg` | 사용자, 운영자 |
| 제공자 및 인증 | `/provider`, `/login`, `/logout`, `/onboard-github` | 사용자 |
| 세션 및 대화 | 기본 채팅, `/resume`, `/session`, `/export`, `/clear`, `/compact`, `/rewind`, `/rename`, `/tag` | 사용자 |
| 컨텍스트 및 편집 | `/files`, `/add-dir`, `/context`, `/copy`, `/diff`, `/branch`, 파일/셸/검색 도구 | 사용자, 개발자 |
| 권한 및 보안 | `/permissions`, `/plan`, `/sandbox`, `/privacy-settings`, 정책 로딩 | 운영자 |
| 메모리 | `/memory`, CLAUDE.md 체계, 자동 메모리 | 사용자 |
| 작업 및 배치 | `/tasks`, 백그라운드 작업, cron 스케줄러, 데몬 | 사용자, 운영자 |
| 상태 및 설정 | `/status`, `/config`, `/usage`, `/cost`, `/doctor`, `/insights`, `/theme`, `/color`, `/output-style`, `/keybindings`, `/statusline` | 사용자, 운영자 |
| 외부 연동 | `/ide`, `/desktop`, `/voice`, `/remote-env`, `/chrome`, `/mobile`, 원격 세션 | 사용자 |
| 확장 | `/mcp`, `/plugin`, `/skills`, `/hooks`, `/reload-plugins` | 운영자 |
| 협업 및 리뷰 | `/review`, `/ultrareview`, `/security-review`, `/pr-comments`, `/install-github-app`, `/install-slack-app` | 개발자, 저장소 관리자 |

## 6. 상세 기능 명세

### 6.1 CLI 기동 및 런타임 초기화

- 기능명: CLI 기동 및 런타임 초기화
- 기능 개요: 실행 인자를 해석하고, 설정 및 인증 정보를 선적재한 뒤, 적절한 실행 경로를 선택한다. 일반 대화형 UI뿐 아니라 버전 출력, 원격 제어 브리지, 데몬, 백그라운드 세션, 템플릿 작업, 특수 MCP 호스트 구동 같은 빠른 경로도 포함한다.
- 기능 목적: 최초 진입 시 잘못된 환경을 조기에 차단하고, 사용자가 지정한 모델 제공자와 실행 모드를 정확히 반영한다.
- 사용 대상자 또는 권한 대상: 모든 사용자, 운영자, 내부 기능 사용자
- 사전 조건:
  - Node.js 또는 Bun 런타임이 정상 설치되어 있어야 한다.
  - 사용하려는 제공자에 필요한 인증 정보가 준비되어 있어야 한다.
  - 저장된 제공자 프로필이 있다면 현재 환경과 충돌하지 않아야 한다.
- 진입 경로:
  - `openpro`
  - `bun run dev`
  - `openpro --version`
  - `openpro remote-control`
  - `openpro daemon`
  - `openpro ps|logs|attach|kill`
- 상세 동작 절차:
  1. 프로세스 인자를 읽고 빠른 경로 여부를 판단한다.
  2. 설정 시스템을 활성화하고 안전한 환경 변수만 설정 파일로부터 반영한다.
  3. GitHub Models 토큰을 secure storage에서 환경 변수로 hydrate한다.
  4. `.openpro-profile.json`을 읽어 저장된 제공자 프로필을 시작 환경으로 병합한다.
  5. 제공자 환경 검증을 수행한다.
  6. 검증에 성공하면 시작 화면을 출력하고 전체 UI 또는 전용 핸들러를 로드한다.
  7. `remote-control`, `daemon`, `ps/logs/attach/kill`, 템플릿, 특수 MCP 서버 경로는 대화 UI 대신 해당 전용 진입점을 실행한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| CLI args | 실행 경로와 기능을 결정하는 인자 | 빠른 경로는 전체 UI 로딩 없이 종료 가능 |
| 환경 변수 | 제공자 선택, API 키, Codex 인증, GitHub 토큰 등 | 값이 없거나 placeholder면 즉시 실패 가능 |
| 저장 프로필 | `.openpro-profile.json` | 현재 환경과 충돌 시 경고 후 무시 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 시작 화면 출력 | 정상 UI 진입 전 그라데이션 시작 화면 표시 |
| 버전 문자열 출력 | `--version` 경로 |
| 검증 오류 출력 후 종료 | 제공자 인증/환경 미충족 시 |
| 전용 프로세스 실행 | 브리지, 데몬, BG 세션, 템플릿 등 |

- 화면 구성 요소 설명:

| 화면/요소 | 설명 |
|---|---|
| 시작 화면 | 전체 UI 로딩 전 표시되는 안내 화면 |
| 표준 오류 메시지 | 환경 검증 실패, 저장 프로필 무시 경고 출력 |
| 전용 프로세스 출력 | `ps/logs/attach/kill`, 데몬 등은 텍스트/전용 UI 사용 |

- 유효성 검증 규칙:
  - `CLAUDE_CODE_USE_GEMINI=1`이면 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`가 필요하다.
  - `CLAUDE_CODE_USE_GITHUB=1`이고 OpenAI 모드가 아니면 `GITHUB_TOKEN` 또는 `GH_TOKEN`이 필요하다.
  - `CLAUDE_CODE_USE_OPENAI=1`일 때 로컬이 아닌 base URL이면 `OPENAI_API_KEY`가 필요하다.
  - `OPENAI_API_KEY=SUA_CHAVE`는 placeholder로 간주되어 실패한다.
  - Codex responses 전송 방식을 사용하면 `CODEX_API_KEY` 또는 `auth.json`과 account id가 필요하다.
- 비즈니스 로직:
  - 저장된 제공자 프로필은 현재 프로세스 환경보다 우선 적용되지만, 검증 실패 시 무시된다.
  - GitHub Models 토큰은 secure storage에 저장되어 있고 환경 변수 미설정 시 자동 hydrate된다.
  - 빠른 경로는 최소 모듈만 로드하여 시작 시간을 줄인다.
  - 원격 제어는 로그인 상태와 조직 정책 허용 여부를 모두 만족해야 한다.
- 상태값 변화:
  - 설정 시스템 비활성 → 활성
  - 저장 프로필 미적용 → 적용 또는 무시
  - 인증 미확인 → 검증 완료
  - 일반 모드 → 전용 실행 모드 분기
- 저장 및 수정되는 데이터:
  - 직접 저장은 없으나, 프로필 적용 결과가 `process.env`에 반영된다.
  - 일부 경로는 secure storage 토큰을 환경 변수로 적재한다.
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 제공자 인증 누락 | 메시지 출력 후 프로세스 종료 |
| Codex account id 누락 | 로그인 재시도 또는 환경 변수 수동 지정 요구 |
| 저장 프로필 손상/부적합 | 경고 출력 후 프로필 무시, 기본 환경으로 계속 진행 |
| 원격 제어 정책 차단 | 오류 출력 후 브리지 시작 차단 |

- 사용자 노출 메시지:
  - `OPENAI_API_KEY is required when ...`
  - `Codex auth is required for ...`
  - `Warning: ignoring saved provider profile. ...`
- 로그 및 감사 이력 처리:
  - 시작 경로별 프로파일링 체크포인트를 남긴다.
  - 인증/정책 로딩 결과는 오류 로그 또는 종료 사유로 남는다.
- 연관 기능:
  - 6.2 제공자 및 인증 관리
  - 6.7 백그라운드 세션 및 데몬
  - 6.9 원격 제어 및 외부 연동
- 테스트 시 검증 포인트:
  - 정상 OpenAI/Codex/GitHub/Gemini 환경에서 UI가 시작되는지 확인
  - placeholder API 키 입력 시 즉시 실패하는지 확인
  - 로컬 base URL이면 API 키 없이 통과하는지 확인
  - 저장 프로필이 잘못되었을 때 경고 후 기본 환경으로 시작하는지 확인
  - `--version`이 전체 UI 없이 즉시 종료되는지 확인

### 6.2 제공자 설정 및 인증 관리

- 기능명: 모델 제공자 설정 및 인증 관리
- 기능 개요: OpenAI 호환, Ollama, Gemini, Codex, GitHub Models, Claude.ai 인증을 설정하고 저장한다. 저장소·사용자 환경에 따라 토큰 저장 방식과 인증 절차가 달라진다.
- 기능 목적: 모델 제공자 변경과 인증 수단 구성을 CLI 내부에서 일관되게 처리한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 인증 사용자, 저장소 관리자
- 사전 조건:
  - 네트워크 연결 또는 로컬 모델 서버가 준비되어 있어야 한다.
  - GitHub Models 또는 Claude.ai 기능은 해당 계정이 있어야 한다.
- 진입 경로:
  - `/provider`
  - `/login`
  - `/logout`
  - `/onboard-github`
  - `/install-github-app`
  - `/install-slack-app`
- 상세 동작 절차:
  1. `/provider`는 제공자 선택 메뉴를 띄운다.
  2. OpenAI 호환 제공자 선택 시 API 키, base URL, 모델명을 순차 입력받는다.
  3. Ollama 선택 시 로컬 서버/모델을 감지하고 추천 모델을 제시할 수 있다.
  4. Gemini 선택 시 API 키와 모델명을 입력받는다.
  5. Codex 선택 시 `~/.codex/auth.json` 또는 `CODEX_API_KEY`를 사용해 인증 정보를 해석한다.
  6. 결과를 `.openpro-profile.json`로 저장한다.
  7. `/login`은 OAuth 흐름으로 Claude.ai 계정을 연동하고 정책, 설정, 캐시를 재초기화한다.
  8. `/logout`은 인증 관련 캐시와 토큰을 정리한다.
  9. `/onboard-github`는 device code 또는 PAT 입력을 통해 GitHub Models 토큰을 secure storage에 저장하고 user settings에 `CLAUDE_CODE_USE_GITHUB=1`, `OPENAI_MODEL`을 설정한다.
  10. `/install-github-app`은 GitHub Actions 워크플로 설치 마법사를 진행한다.
  11. `/install-slack-app`은 Slack 마켓플레이스 설치 페이지를 브라우저로 연다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| API key | OpenAI, Gemini, Codex, GitHub Models 등에 사용 | provider별 필수 여부 상이 |
| Base URL | OpenAI 호환 서버 주소 | 미입력 시 기본값 `https://api.openai.com/v1` |
| Model | 모델 식별자 | Codex alias `codexplan`, `codexspark` 등 지원 |
| GitHub 인증 방식 | device code 또는 PAT | device flow는 GitHub 브라우저 인증 필요 |
| GitHub Actions 대상 저장소 | `owner/repo` | gh CLI 권한 필요 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 저장된 프로필 | `.openpro-profile.json` 생성 또는 갱신 |
| secure storage 저장 | GitHub Models 토큰, 일부 계정 자격 증명 저장 |
| 사용자 설정 갱신 | GitHub Models 활성화, voice 등 일부 기능 설정 |
| 워크플로 브랜치/파일 생성 | GitHub Actions 설치 시 `.github/workflows/*.yml` 작성 |

- 화면 구성 요소 설명:

| 화면명 | 구성 요소 | 설명 |
|---|---|---|
| Provider wizard | 제공자 목록, API key 입력, base URL 입력, 모델 입력 | 단계별 인터랙티브 설정 |
| GitHub Models setup | 브라우저 로그인, PAT 입력, 취소 메뉴 | device flow 또는 PAT 방식 선택 |
| GitHub Actions 설치 마법사 | 저장소 선택, 시크릿명 선택, 워크플로 선택, 진행 상태 | gh API 호출 결과에 따라 단계 이동 |

- 유효성 검증 규칙:
  - OpenAI 호환 제공자에서 로컬 주소가 아니면 API 키가 필수다.
  - GitHub Models 토큰 저장 후 user settings 반영에 실패하면 경고를 반환한다.
  - GitHub Actions 설치에는 `gh auth` 권한과 대상 저장소 admin 수준 권한이 필요하다.
  - Slack 앱 설치는 브라우저 열기에 실패하면 URL을 텍스트로 안내한다.
- 비즈니스 로직:
  - Codex alias는 내부적으로 GPT-5.4, GPT-5.3 Codex Spark 등 실제 모델로 해석된다.
  - GitHub Models 토큰은 macOS에서 키체인 우선, 그 외에는 대체 저장소를 사용할 수 있다.
  - 평문 저장소를 사용하는 경우 경고를 반환한다.
  - `/login` 성공 후 managed settings, policy limits, GrowthBook, trusted device 정보가 새로고침된다.
- 상태값 변화:
  - 제공자 미설정 → 프로필 저장됨
  - 미로그인 → 로그인됨
  - GitHub Models 미설정 → secure storage 저장됨
  - GitHub Actions 미설치 → 워크플로 브랜치/PR 생성 준비
- 저장 및 수정되는 데이터:
  - `.openpro-profile.json`
  - `~/.claude/.credentials.json` 또는 OS secure storage
  - user settings의 env 관련 키
  - GitHub 저장소의 workflow 파일과 시크릿 참조
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| secure storage 저장 실패 | 경고 메시지와 함께 설정 미완료 처리 |
| user settings 문법 오류 | 토큰 저장은 성공해도 설정 반영 실패 메시지 표시 |
| GitHub device flow 실패 | 오류 단계로 전환, 메뉴로 복귀 가능 |
| gh 권한 부족 | GitHub Actions 설치 실패, `gh auth refresh` 등 도움말 표시 |
| 브라우저 열기 실패 | URL 직접 방문 안내 |

- 사용자 노출 메시지:
  - `GitHub Models onboard complete. Token stored in secure storage...`
  - `Voice mode requires a Claude.ai account. Please run /login to sign in.`
  - `Couldn't open browser. Visit: ...`
- 로그 및 감사 이력 처리:
  - Slack 앱 설치 클릭 수가 전역 설정에 누적된다.
  - GitHub Actions 설치 시작/실패 사유는 analytics 이벤트로 남는다.
  - 로그인/로그아웃은 인증 관련 캐시 재설정과 함께 처리된다.
- 연관 기능:
  - 6.1 CLI 초기화
  - 6.8 상태 및 설정
  - 6.9 외부 연동
- 테스트 시 검증 포인트:
  - 각 제공자별 정상 저장과 재기동 후 프로필 재적용 검증
  - GitHub Models device flow와 PAT flow 각각 검증
  - secure storage 실패 시 사용자 메시지 확인
  - GitHub Actions 설치 시 기존 워크플로 존재, 권한 부족, 저장소 미존재 케이스 확인
  - Slack 앱 설치 시 브라우저 성공/실패 분기 확인

### 6.3 대화 세션, 재개, 복사, 내보내기

- 기능명: 대화 세션 및 이력 관리
- 기능 개요: 현재 대화를 저장하고, 이전 세션을 재개하고, 제목/태그/요약을 유지하며, 세션을 텍스트 파일로 내보낸다. 원격 세션인 경우 QR 코드와 URL을 보여줄 수 있다.
- 기능 목적: 사용자가 긴 작업 흐름을 중단 없이 이어가고, 운영/지원/감사 목적으로 세션 내용을 재사용할 수 있게 한다.
- 사용 대상자 또는 권한 대상: 모든 사용자
- 사전 조건:
  - 세션 저장 경로에 쓰기 권한이 있어야 한다.
  - 재개하려는 세션 로그가 존재해야 한다.
- 진입 경로:
  - 기본 대화 화면
  - `/resume`
  - `/session`
  - `/export`
  - `/copy`
  - `/clear`, `/compact`, `/rewind`, `/rename`, `/tag`
- 상세 동작 절차:
  1. 대화가 진행될 때마다 세션 로그가 JSONL로 누적 저장된다.
  2. `/resume` 입력 시 동일 저장소 또는 전체 프로젝트 세션 목록을 로드한다.
  3. 선택된 세션이 동일 디렉터리면 즉시 복원한다.
  4. 동일 저장소 다른 워크트리면 직접 재개한다.
  5. 다른 프로젝트 세션이면 재개 명령을 클립보드에 복사하고 안내 메시지를 출력한다.
  6. `/session`은 원격 모드일 때 URL과 QR 코드를 보여준다.
  7. `/export`는 현재 대화를 평문 텍스트로 렌더링하고 파일로 저장한다.
  8. `/copy`는 최근 답변 또는 선택 콘텐츠를 클립보드 친화적 형식으로 복사한다.
  9. `/clear`는 현재 대화 컨텍스트를 비우고, `/compact`는 압축 요약, `/rewind`는 특정 지점으로 되돌리기, `/rename`과 `/tag`는 메타데이터를 갱신한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| session id | UUID 형식 세션 식별자 | 잘못된 UUID면 세션 선택 UI로 유도 |
| custom title | 사용자 지정 제목 | 제목 검색은 기능 활성 시 exact match 지원 |
| export 파일명 | 사용자가 직접 입력하는 파일명 | `.txt` 확장자 자동 보정 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 세션 목록 UI | 재개 가능한 세션 목록 |
| 재개 완료 | 기존 대화 상태 복원 |
| 교차 프로젝트 안내 | 재개 명령 복사 메시지 출력 |
| export 파일 | `conversation-*.txt` 또는 프롬프트 기반 파일명 |
| QR 코드 | 원격 세션 URL 시각화 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Resume selector | 세션 목록, 전체 프로젝트 토글, 검색 | 화살표와 Enter로 선택 |
| Session dialog | QR 코드, 브라우저 열기 URL | 원격 모드 전용 |
| Export dialog | 기본 파일명, 저장 확인 메시지 | 인자 없이 실행 시 표시 |

- 유효성 검증 규칙:
  - 세션 ID는 UUID여야 하며 로그 파일이 존재해야 한다.
  - export 인자에 확장자가 없으면 `.txt`를 부여한다.
  - 파일명은 첫 사용자 프롬프트 첫 줄, 최대 50자 기준으로 sanitize된다.
- 비즈니스 로직:
  - 세션 로그는 같은 저장소 워크트리를 묶어서 로드할 수 있다.
  - lite 로그는 전체 로그로 재로드 후 재개한다.
  - 세션 제목 기능이 활성화된 경우 제목 exact match로 직접 재개할 수 있다.
  - export 내용은 메시지와 도구 출력이 평문으로 정규화된 결과다.
- 상태값 변화:
  - 실행 중 세션 → 저장된 세션
  - 저장된 세션 → 재개 중 → 활성 세션
  - 원격 세션 URL 없음 → QR 표시 가능 상태
- 저장 및 수정되는 데이터:
  - `~/.claude/projects/.../*.jsonl`
  - 세션 커스텀 제목, 태그, 요약, PR 링크 메타데이터
  - export 텍스트 파일
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 세션 없음 | `No conversations found to resume` |
| 잘못된 세션 식별자 | 선택 UI 또는 오류 메시지 표시 |
| export 저장 실패 | 오류 메시지 출력 후 현재 세션 유지 |
| 원격 모드 아님 | `/session`에서 원격 모드 안내 메시지 출력 |

- 사용자 노출 메시지:
  - `Resume cancelled`
  - `This conversation is from a different directory.`
  - `Conversation exported to: ...`
- 로그 및 감사 이력 처리:
  - 세션 본문, 요약, 서브에이전트 실행 이력까지 파일에 남는다.
  - 세션 재개 시 복원 시점의 attribution과 worktree 상태를 함께 처리한다.
- 연관 기능:
  - 6.4 컨텍스트 및 도구 실행
  - 6.6 메모리
  - 6.7 백그라운드 세션
- 테스트 시 검증 포인트:
  - 동일 디렉터리, 동일 저장소 다른 워크트리, 다른 프로젝트 세션 재개 각각 검증
  - 큰 첫 메시지로 인해 enrich 실패한 세션도 direct lookup으로 재개되는지 확인
  - export 기본 파일명 생성 규칙 검증
  - 원격 세션 URL이 없을 때 `/session` 안내 메시지 검증

### 6.4 컨텍스트 관리, 파일 조작, 도구 실행

- 기능명: 프로젝트 컨텍스트 및 작업 도구 실행
- 기능 개요: 파일 읽기/수정/쓰기, Glob/Grep, Bash, Notebook 편집, Web fetch/search, Task 생성/조회, Agent 실행을 통합 제공한다. 슬래시 명령과 일반 자연어 프롬프트 양쪽에서 활용된다.
- 기능 목적: 사용자가 단일 인터페이스에서 코드베이스 탐색, 수정, 명령 실행, 외부 정보 조회를 수행하도록 지원한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 개발자
- 사전 조건:
  - 대상 경로에 접근 권한이 있어야 한다.
  - 도구별 권한 규칙이 허용 상태여야 한다.
  - 외부 웹/명령 호출은 현재 모드에서 차단되지 않아야 한다.
- 진입 경로:
  - 일반 프롬프트
  - `/files`
  - `/add-dir`
  - `/context`
  - `/diff`
  - `/branch`
  - `/copy`
- 상세 동작 절차:
  1. 대화 또는 명령에서 필요한 도구를 런타임이 노출한다.
  2. 사용자가 프로젝트 외 경로를 추가하려면 `/add-dir`로 워크스페이스 컨텍스트에 포함한다.
  3. 도구는 현재 permission context와 remote-safe subset을 기준으로 필터링된다.
  4. 파일 조작은 읽기, 패치 기반 편집, 신규 쓰기, 노트북 수정으로 나뉜다.
  5. 셸 도구는 명령 실행 결과를 다시 대화 컨텍스트에 제공한다.
  6. Web fetch/search는 URL 또는 검색 질의를 통해 외부 정보를 가져온다.
  7. Agent tool은 서브에이전트 작업을 생성하고 결과를 회수한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| 파일 경로 | 절대/상대 경로 | 허용된 워크스페이스 루트 내 우선 |
| 검색 패턴 | Glob/Grep 패턴 | 원격/권한 모드에 따라 제약 가능 |
| 셸 명령 | Bash 또는 PowerShell 성격 명령 | 위험 명령은 추가 허가 필요 |
| 외부 URL | fetch 대상 | 네트워크/정책 제약 적용 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 파일 내용/검색 결과 | 에이전트가 읽고 요약 가능한 형태 |
| 코드 패치 | 파일 수정 반영 |
| 명령 실행 결과 | stdout/stderr가 세션에 기록 |
| 서브에이전트 결과 | 별도 작업 로그와 함께 반환 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Files dialog | 현재 컨텍스트 파일 목록, 선택 UI | 파일 기반 작업 범위 확인 |
| Context 관리 화면 | 포함 디렉터리/파일 목록 | 프로젝트 외 추가 컨텍스트 제어 |
| Diff/Branch 화면 | 변경 파일, 브랜치 관련 안내 | Git 상태 확인과 브랜치 분기 지원 |

- 유효성 검증 규칙:
  - `/add-dir`는 유효한 디렉터리인지, 워크스페이스에 포함 가능한지 검증한다.
  - 편집 도구는 대상 파일 존재 여부와 쓰기 가능 여부를 확인한다.
  - remote-safe 명령은 원격 실행에서 제한된 도구 집합만 허용한다.
- 비즈니스 로직:
  - 도구 풀은 `src/tools.ts`에서 현재 빌드와 설정 조건에 맞춰 구성된다.
  - LSP, Worktree, Config, Task 관련 도구는 기능 플래그 또는 설정에 따라 추가된다.
  - `TodoWrite`, `TaskCreate/List/Update`, `EnterPlanMode`, `ExitPlanMode`는 단순 편집이 아닌 작업 흐름 제어 역할을 가진다.
  - `AgentTool`은 서브에이전트에게 일부 작업을 위임하며, 별도 로그와 상태를 유지한다.
- 상태값 변화:
  - 컨텍스트 외부 → 컨텍스트 포함
  - 파일 원본 → 패치 적용 상태
  - 명령 대기 → 실행 → 완료/실패
  - 작업 미생성 → 서브에이전트 생성 → 결과 회수
- 저장 및 수정되는 데이터:
  - 실제 파일 시스템
  - 세션 로그의 tool use 기록
  - 작업 메타데이터 및 백그라운드 task state
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 경로 없음 | 즉시 오류 반환 |
| 읽기/쓰기 권한 없음 | 권한 오류 또는 승인 요청 |
| 명령 실패 | stderr와 종료 코드 기반 실패 처리 |
| 외부 요청 실패 | 네트워크 오류 또는 재시도 정책에 따름 |

- 사용자 노출 메시지:
  - 파일/경로 관련 오류
  - 명령 실행 실패 메시지
  - 권한 요청 프롬프트
- 로그 및 감사 이력 처리:
  - XML 태그 기반으로 bash stdout/stderr, local command stdout/stderr, task id 등이 세션 로그에 저장된다.
  - 파일 접근 훅이 메모리 파일 접근 여부를 구분 추적할 수 있다.
- 연관 기능:
  - 6.5 권한 및 보안
  - 6.7 백그라운드 작업
  - 6.10 MCP
- 테스트 시 검증 포인트:
  - 읽기 전용 파일 수정 시 실패 메시지 확인
  - 외부 디렉터리 추가 검증 로직 확인
  - 셸 성공/실패/타임아웃 케이스 검증
  - AgentTool 서브에이전트 생성 후 로그 분리 저장 확인

### 6.5 권한 제어, 샌드박스, 계획 모드

- 기능명: 권한 제어 및 안전 실행
- 기능 개요: 위험 도구 실행을 사용자 승인 또는 정책에 따라 제어한다. 계획 모드에서는 즉시 실행보다 계획 수립을 우선하며, 자동 모드에서는 허용 규칙을 기반으로 무인 실행 범위를 확대한다.
- 기능 목적: 코드 변경과 셸 실행 같은 고위험 작업을 통제하면서도 사용성을 유지한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 프로젝트 운영자, 조직 관리자
- 사전 조건:
  - 설정 시스템이 활성화되어 있어야 한다.
  - 정책 제한이 적용되는 경우 정책 로딩이 완료되어야 한다.
- 진입 경로:
  - `/permissions`
  - `/plan`
  - `/sandbox`
  - `/privacy-settings`
  - 권한 프롬프트가 자동으로 뜨는 모든 도구 실행 시점
- 상세 동작 절차:
  1. 시스템은 현재 permission mode와 always allow/deny 규칙을 읽는다.
  2. 도구 실행 시 규칙과 위험도 분류를 기반으로 자동 허용, 사용자 질의, 차단을 결정한다.
  3. `/plan`은 permission mode를 `plan`으로 전환하고 계획 파일을 생성/표시한다.
  4. 자동 모드 진입 시 위험한 Bash/PowerShell/Agent allow rule을 탐지해 제거 또는 비활성화한다.
  5. plan 모드 종료 시 원래 권한 모드와 위험 규칙을 복원한다.
  6. 사용자 또는 조직 정책이 우회 실행을 금지하면 우회 모드 진입을 막는다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| permission rules | allow/deny 규칙 집합 | 위험 규칙은 auto mode에서 제거 가능 |
| mode 전환 요청 | default, plan, auto 등 | 정책/설정에 따라 제한 가능 |
| tool metadata | 도구명, 명령 패턴, 위험도 | classifier와 함께 판정 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 승인 프롬프트 | 사용자에게 허용 여부 질의 |
| 모드 전환 | plan mode 또는 auto mode 적용 |
| 규칙 정리 | 위험 규칙 제거/복원 |
| 차단 메시지 | 정책 또는 권한 부족으로 실행 거부 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Permission dialog | 요청 도구, 명령, 허용/거부 선택 | 민감 작업 전 표시 |
| Plan view | 현재 계획 내용, 파일 열기 | `/plan` 실행 시 사용 |

- 유효성 검증 규칙:
  - Bash wildcard, 인터프리터 실행, `python:*` 류 허용 규칙은 auto mode에서 위험 규칙으로 간주된다.
  - PowerShell에서 `powershell`, `pwsh`, `cmd`, `wsl`, `invoke-expression`, `start-process` 류는 위험 규칙으로 분류된다.
  - Agent allow rule은 classifier를 우회할 수 있어 auto mode에서 제거 대상이다.
- 비즈니스 로직:
  - plan 모드 진입 전 상태를 `prePlanMode`로 보존한다.
  - 일부 설정에서는 plan 모드에서도 auto semantics를 유지할 수 있다.
  - 사용자 승인 도구 AskUserQuestion은 missed cron task나 권한 질의에도 재사용된다.
  - 조직 정책은 원격 제어, bypass 권한 등 상위 기능을 추가로 막을 수 있다.
- 상태값 변화:
  - default → plan
  - auto → 위험 규칙 제거된 auto
  - 승인 대기 → 허용/거부
- 저장 및 수정되는 데이터:
  - 설정 파일의 권한 규칙
  - 계획 파일 내용
  - 세션 로그의 승인/차단 기록
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 권한 규칙 구문 오류 | 설정 반영 실패 메시지 |
| 위험 규칙 감지 | auto mode 진입 시 제거 및 경고 |
| 정책상 금지 기능 요청 | 즉시 거부 |

- 사용자 노출 메시지:
  - `Enabled plan mode`
  - 권한 요청/거부 메시지
  - 정책 차단 메시지
- 로그 및 감사 이력 처리:
  - 권한 요청과 최종 결정이 세션 로그에 남는다.
  - 감사가 필요한 기능은 tool use 및 user choice를 통해 재구성 가능하다.
- 연관 기능:
  - 6.4 도구 실행
  - 6.7 예약 작업 실행
  - 6.10 MCP
- 테스트 시 검증 포인트:
  - 위험 Bash rule이 auto mode에서 제거되는지 확인
  - plan mode 진입/종료 시 이전 모드 복원 확인
  - 조직 정책 차단 상황에서 remote-control, bypass 류 기능이 차단되는지 확인
  - 승인 대화상자 Esc/취소 동작 검증

### 6.6 메모리 및 지속 컨텍스트 관리

- 기능명: 메모리 파일 및 자동 메모리 관리
- 기능 개요: 사용자 전역, 프로젝트, 로컬, 관리형, 자동 메모리 파일을 생성·열람·편집한다. 자동 메모리는 프로젝트별 별도 디렉터리에 누적된다.
- 기능 목적: 반복적으로 필요한 지침, 프로젝트 규칙, 개인 선호, 장기 컨텍스트를 지속적으로 유지한다.
- 사용 대상자 또는 권한 대상: 모든 사용자, 운영자
- 사전 조건:
  - 파일 시스템에 메모리 파일을 저장할 수 있어야 한다.
  - 외부 편집기 설정이 있으면 호출 가능해야 한다.
- 진입 경로:
  - `/memory`
  - 세션 중 메모리 파일 참조
  - 자동 메모리 생성 로직
- 상세 동작 절차:
  1. `/memory` 실행 시 메모리 유형 선택 화면을 연다.
  2. 선택된 유형의 경로를 계산한다.
  3. 경로가 없으면 디렉터리와 파일을 생성한다.
  4. `$VISUAL` 또는 `$EDITOR`를 통해 외부 편집기를 실행한다.
  5. 자동 메모리는 프로젝트 루트 기반으로 전용 memory 디렉터리를 사용한다.
  6. 일일 로그는 날짜별 마크다운 파일에 저장된다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| 메모리 유형 | user, project, local, managed, auto | 유형별 경로가 다름 |
| 편집기 환경 변수 | `$VISUAL`, `$EDITOR` | 없으면 시스템 기본 방식 사용 가능 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 메모리 파일 생성 | 최초 접근 시 생성 |
| 편집기 실행 | 사용자가 직접 편집 가능 |
| 자동 메모리 누적 | 프로젝트별 일일 로그 및 엔트리 파일 생성 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Memory selector | 메모리 유형 목록 | 선택 후 즉시 편집기 실행 |

- 유효성 검증 규칙:
  - 경로 계산 실패 시 오류를 반환한다.
  - 쓰기 권한이 없으면 파일 생성/편집을 중단한다.
- 비즈니스 로직:
  - user 메모리는 `~/.claude/CLAUDE.md`
  - project 메모리는 `<cwd>/CLAUDE.md`
  - local 메모리는 `<cwd>/CLAUDE.local.md`
  - auto-memory는 별도 memory base 디렉터리를 사용하며 환경 변수 또는 trusted settings로 override 가능하다.
- 상태값 변화:
  - 메모리 파일 없음 → 생성됨
  - 메모리 미연결 → 대화 컨텍스트에서 참조 가능
- 저장 및 수정되는 데이터:
  - 각종 `CLAUDE*.md`, `MEMORY.md`, 날짜별 로그 파일
- 오류 및 예외 처리 방식:
  - 파일 생성 실패 시 오류 메시지 반환
  - 편집기 실행 실패 시 외부 편집기 설정 점검 필요 메시지 출력 가능
- 사용자 노출 메시지:
  - 메모리 도움말과 docs URL 안내
- 로그 및 감사 이력 처리:
  - 메모리 파일 접근은 세션 파일 접근 훅으로 구분 추적 가능하다.
- 연관 기능:
  - 6.3 세션 관리
  - 6.4 파일/도구 실행
- 테스트 시 검증 포인트:
  - 각 메모리 유형별 올바른 경로 계산 검증
  - 파일 미존재 시 자동 생성 검증
  - auto-memory 일일 로그 경로 생성 규칙 검증

### 6.7 백그라운드 작업, 예약 실행, 데몬

- 기능명: 백그라운드 작업 및 스케줄링
- 기능 개요: 셸 작업, 로컬 에이전트, 원격 에이전트, 팀메이트 작업, 워크플로, 모니터 작업, dream 작업을 백그라운드에서 실행하고, cron 기반 예약 작업과 장기 세션 관리 기능을 제공한다.
- 기능 목적: 긴 작업을 현재 대화를 막지 않고 수행하고, 반복 작업과 운영 자동화를 가능하게 한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 운영자, 내부 사용자
- 사전 조건:
  - 작업 런타임과 세션 저장소가 정상 동작해야 한다.
  - 예약 작업은 프로젝트 `.claude` 디렉터리에 접근 가능해야 한다.
- 진입 경로:
  - `/tasks`
  - `openpro --bg`
  - `openpro ps|logs|attach|kill`
  - cron scheduler
  - `daemon`
- 상세 동작 절차:
  1. 작업 생성 시 task state가 app state에 등록된다.
  2. `/tasks`는 현재 백그라운드 작업 목록을 유형별로 정렬하여 보여준다.
  3. 사용자는 Enter로 상세 보기, `x`로 중지, `f`로 팀메이트 전경 전환을 수행한다.
  4. 작업 상세 화면은 유형별 전용 다이얼로그를 띄운다.
  5. BG 세션 모드에서는 세션 레지스트리에 세션을 등록하고 `ps/logs/attach/kill` 명령으로 제어한다.
  6. 예약 작업은 `<project>/.claude/scheduled_tasks.json`에서 로드된다.
  7. 스케줄러는 1초마다 다음 실행 시각을 계산하고, 프로젝트 단위 락으로 중복 실행을 방지한다.
  8. 놓친 one-shot 작업은 사용자에게 실행 여부를 다시 묻는다.
  9. recurring 작업은 최대 수명 설정이 있으면 자동 만료될 수 있고, `permanent`면 유지된다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| task id | 작업 식별자 | 유형별 detail dialog 분기 |
| cron 표현식 | 5필드 cron | 월/연/초 확장 미지원 |
| recurring/permanent/durable | 예약 작업 속성 | durable은 파일 기반 지속 저장 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 작업 목록/상세 | 백그라운드 작업 현황 표시 |
| 세션 목록 | BG 세션 레지스트리 조회 |
| 작업 중지/전환 | 키 입력으로 상태 변경 |
| 예약 실행 | 시간 도달 시 프롬프트 자동 실행 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Background Tasks dialog | 목록, 상세 보기, 단축키 힌트 | `Enter`, `x`, `f`, `Esc` 사용 |
| Task detail dialogs | shell, agent, remote session, workflow, teammate 등 | 유형별 상세 상태와 제어 |

- 유효성 검증 규칙:
  - cron 파서는 분/시/일/월/요일 5필드만 허용한다.
  - 잘못된 작업 파일은 로딩 실패 또는 개별 작업 스킵 처리 대상이다.
  - foreground된 local_agent는 목록에서 제외될 수 있다.
- 비즈니스 로직:
  - 작업 정렬은 실행 상태 우선, 시작 시각 내림차순 기준이다.
  - 팀메이트 spinner tree 모드에서는 일부 팀메이트 항목을 대화 트리로만 표시한다.
  - missed one-shot은 사용자가 승인해야 실행된다.
  - 데몬은 장기 supervisor 역할을 하며, `--daemon-worker` 빠른 경로로 worker를 실행할 수 있다.
- 상태값 변화:
  - pending → running → completed/failed/killed
  - scheduled → due → fired
  - background session detached → attached/terminated
- 저장 및 수정되는 데이터:
  - 앱 상태의 task map
  - 세션 레지스트리
  - `.claude/scheduled_tasks.json`
  - task output 관련 로그
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 작업 상세 진입 시 task 제거됨 | 자동으로 목록으로 복귀하거나 대화상자 종료 |
| kill 실패 | 유형별 kill 함수 실패 메시지 또는 상태 유지 |
| cron 파일 손상 | 로딩 실패 후 스케줄러 무시 또는 경고 |
| 중복 실행 경쟁 | 프로젝트 락으로 방지 |

- 사용자 노출 메시지:
  - `Background tasks dialog dismissed`
  - `Viewing teammate`
  - `Viewing leader`
- 로그 및 감사 이력 처리:
  - 작업 상태와 도구 출력은 세션 로그 및 task state로 추적된다.
  - 원격 작업은 별도 remote-agents 메타파일이 생성된다.
- 연관 기능:
  - 6.3 세션 관리
  - 6.4 도구 실행
  - 6.9 원격 제어
- 테스트 시 검증 포인트:
  - task 유형별 목록/상세 화면 전환 검증
  - `x`, `f`, Enter, Esc 단축키 동작 검증
  - missed one-shot 재확인 흐름 검증
  - recurring 작업 만료, permanent 예외 검증
  - `ps/logs/attach/kill` 명령으로 BG 세션 조작 가능 여부 확인

### 6.8 설정, 상태, 사용량, 진단, UI 개인화

- 기능명: 설정 및 운영 상태 관리
- 기능 개요: 설정 화면과 상태/사용량/진단 화면을 제공하며, 모델/테마/출력 스타일/키바인딩/터미널 설정/비용/추가 사용량/상태라인 구성까지 포함한다.
- 기능 목적: 실행 환경을 진단하고, 개인화 설정을 변경하며, 운영 데이터와 비용을 확인할 수 있도록 한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 프로젝트 운영자
- 사전 조건:
  - 설정 파일이 읽기 가능한 상태여야 한다.
  - 일부 진단은 외부 환경 또는 도구 설치 상태에 의존한다.
- 진입 경로:
  - `/status`
  - `/config`
  - `/usage`
  - `/doctor`
  - `/cost`
  - `/extra-usage`
  - `/insights`
  - `/theme`
  - `/color`
  - `/output-style`
  - `/keybindings`
- `/statusline`
- `/terminal-setup`
- `/vim`

- 상세 동작 절차:
  1. `/status`, `/config`, `/usage`는 공통 Settings 컴포넌트를 서로 다른 기본 탭으로 연다.
  2. Status 탭은 diagnosticsPromise를 1회 생성해 같은 호출 안에서는 재조회 없이 재사용한다.
  3. Config 탭은 검색 모드 진입 시 Esc 소유권을 가져가고, 탭 레벨 Esc와 충돌하지 않게 한다.
  4. Usage 탭은 사용량 정보를 보여준다.
  5. `/doctor`는 런타임 진단 화면을 연다.
  6. `/statusline`은 별도 에이전트를 생성해 셸 PS1 기반 status line UI 구성을 지원한다.
  7. `/terminal-setup`은 단축키 호환 터미널 설정을 점검하고 필요한 셋업을 수행한다.
  8. `/cost`, `/extra-usage`, `/insights`는 비용 및 리포트 성격 정보를 제공한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| 설정 변경 값 | 테마, 언어, 키바인딩, 출력 형식 등 | settings file 문법 오류 시 반영 실패 |
| doctor 환경 | provider env, 런타임 도구, 네트워크 접근성 | 환경에 따라 결과 상이 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| Settings pane | Status, Config, Usage 탭 표시 |
| diagnostics | 런타임/환경 점검 결과 |
| statusline setup prompt | 전용 서브에이전트 생성 지시 |
| usage/cost data | 사용량, 비용, 추가 사용량 상태 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Settings | 탭 헤더, 상태 화면, 설정 검색, 사용량 탭 | 메인 운영 설정 화면 |
| Doctor screen | 점검 결과 목록 | 환경 문제 파악용 |
| Keybindings info | 텍스트 결과 | 현재 키바인딩 참고 |

- 유효성 검증 규칙:
  - 설정 저장 시 JSON/설정 파일 구문 오류가 있으면 반영하지 않는다.
  - terminal setup은 지원 터미널 여부를 점검한다.
  - statusline은 비대화형 사용을 비활성화한다.
- 비즈니스 로직:
  - Settings는 모달 내부와 일반 터미널에서 content height 계산 방식이 다르다.
  - Config 검색 중에는 Esc가 검색 해제에 우선 사용된다.
  - statusline 명령은 `Read(~/**)`와 `Edit(~/.claude/settings.json)` 권한을 전제로 에이전트를 호출한다.
  - insights는 세션 로그를 수집하고 요약 모델을 사용해 서사형 인사이트를 생성할 수 있다.
- 상태값 변화:
  - 설정 미변경 → 변경됨
  - diagnostics 미생성 → 생성됨
  - statusline 미설정 → 구성 작업 생성
- 저장 및 수정되는 데이터:
  - 전역/사용자 설정 파일
  - 사용량 캐시, bootstrap 캐시 일부
  - analytics 카운터 및 hint 카운터
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 설정 파일 문법 오류 | 업데이트 실패 메시지 반환 |
| doctor 실패 | 오류를 화면 또는 텍스트로 표시 |
| statusline 설정 실패 | 에이전트 실행 결과로 실패 사유 반환 |

- 사용자 노출 메시지:
  - `Status dialog dismissed`
  - 설정 반영 실패 메시지
  - doctor/runtime check 결과
- 로그 및 감사 이력 처리:
  - 사용량, 비용, 추가 사용량, Slack 설치 클릭 수 등 일부 운영 이벤트는 analytics에 남는다.
  - insights는 세션 로그를 집계용 입력으로 사용한다.
- 연관 기능:
  - 6.1 CLI 기동
  - 6.2 인증 및 제공자
  - 6.13 로그 및 분석
- 테스트 시 검증 포인트:
  - Settings 탭 전환과 Esc 동작 검증
  - doctor 성공/실패/부분경고 케이스 검증
  - statusline 명령이 서브에이전트 프롬프트를 올바르게 생성하는지 검증
  - 설정 문법 오류 상황에서 안전하게 롤백되는지 확인

### 6.9 IDE, 데스크톱, 음성, 원격 환경, 원격 제어

- 기능명: 클라이언트 확장 및 원격 경험 연동
- 기능 개요: IDE 연동, Claude Desktop 핸드오프, 음성 모드, 원격 환경 선택, 브리지 기반 원격 제어, 세션 QR 노출을 제공한다.
- 기능 목적: 동일 세션을 다양한 클라이언트와 실행 환경에서 이어서 사용할 수 있게 한다.
- 사용 대상자 또는 권한 대상: 일반 사용자, 인증 사용자, 조직 정책 허용 사용자
- 사전 조건:
  - IDE 또는 Desktop 앱이 설치되어 있어야 한다.
  - 음성은 Claude.ai 계정, 마이크, 녹음 도구, 권한이 필요하다.
  - 원격 제어는 로그인과 조직 정책 허용이 필요하다.
- 진입 경로:
  - `/ide`
  - `/desktop`
  - `/voice`
  - `/remote-env`
  - `/session`
  - `openpro remote-control`
  - `/chrome`, `/mobile`
- 상세 동작 절차:
  1. `/ide`는 현재 시스템의 지원 IDE와 연결 상태를 탐지한다.
  2. 연결 가능한 IDE가 있으면 dynamic MCP config `ide`를 통해 connect/disconnect 한다.
  3. `/ide open`은 현재 프로젝트 또는 워크트리를 IDE로 연다.
  4. `/desktop`은 Claude Desktop 설치 여부와 버전을 확인한다.
  5. 설치가 없거나 버전이 낮으면 다운로드 여부를 물어보고 브라우저를 연다.
  6. 설치가 적합하면 세션 저장소를 flush한 뒤 deep link로 현재 세션을 데스크톱에 연다.
  7. `/voice`는 현재 토글 상태를 확인하고, 활성화 시 녹음 가능 여부, 계정, 의존 도구, 마이크 권한을 사전 점검한다.
  8. `/remote-env`는 Claude.ai에서 선택 가능한 remote environment 목록을 불러오고 기본 환경 ID를 local settings에 저장한다.
  9. `/session`은 원격 모드일 때 QR 코드와 URL을 보여준다.
  10. `remote-control`은 브리지 프로세스로 실행되며, 로그인, 버전, GrowthBook gate, 조직 정책을 통과해야 시작된다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| IDE 선택 | 감지된 IDE 목록 중 선택 | 현재 workspace와 경로가 맞아야 연결 가능 |
| desktop 설치 상태 | 로컬 OS에서 조회 | Windows/기타 플랫폼 다운로드 URL 다름 |
| voice 설정 | `voiceEnabled`, 언어 설정 | 계정·마이크·도구 요건 필요 |
| remote environment id | Claude.ai가 제공한 환경 ID | local settings에 저장 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| IDE 연결/해제 | MCP 기반 IDE 통신 활성화 |
| 데스크톱 전환 | CLI 세션이 데스크톱으로 이동 |
| 음성 모드 활성화 | push-to-talk 안내 출력 |
| 원격 환경 기본값 저장 | 이후 원격 실행 시 기본 환경으로 사용 |
| 브리지 연결 | 원격 제어용 양방향 연결 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| IDE dialog | 연결 가능한 IDE, 설치 옵션, open 옵션 | VS Code 기반/JetBrains 계열 지원 |
| Desktop handoff | 설치 점검, 다운로드 확인, 진행 상태 | `y/n` 응답 및 로딩 상태 |
| Remote Environment dialog | 환경 목록, 현재 선택값, 설정 출처 표시 | Enter 선택, Esc 취소 |
| Session QR view | QR 코드, 원격 URL | 모바일/브라우저 재진입 지원 |

- 유효성 검증 규칙:
  - IDE 연결 타임아웃은 35초다.
  - 데스크톱은 최소 버전 `v1.1.2396+`가 필요하다.
  - 음성은 `isVoiceModeEnabled()`와 `isAnthropicAuthEnabled()`가 모두 충족되어야 한다.
  - 마이크 권한 거부 시 플랫폼별 설정 경로를 안내한다.
  - remote-control은 `allow_remote_control` 정책이 허용되어야 한다.
- 비즈니스 로직:
  - IDE 연동은 dynamic MCP config로 구현되며, 연결 가능한 IDE가 없으면 확장 설치 유도 경로를 탄다.
  - 데스크톱 핸드오프는 세션 로그 flush 후 진행해 대화 손실을 줄인다.
  - 음성 언어 힌트는 최대 2회만 노출되며, 언어가 바뀌면 카운터를 리셋한다.
  - remote environment 선택이 1개뿐이면 목록 대신 현재 사용 중 메시지만 보여준다.
- 상태값 변화:
  - IDE 미연결 → 연결됨/해제됨
  - desktop handoff `checking` → `flushing` → `opening` → `success`
  - voice disabled → enabled
  - remote environment 미설정 → 기본값 저장됨
  - bridge disconnected → connected
- 저장 및 수정되는 데이터:
  - user settings의 `voiceEnabled`
  - global config의 voice 언어 힌트 카운터
  - local settings의 `remote.defaultEnvironmentId`
  - 세션 URL, dynamic MCP config
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| IDE 미설치 | 설치 옵션 또는 안내 메시지 표시 |
| 데스크톱 미설치/구버전 | 다운로드 확인 후 브라우저 열기 |
| 음성 도구 미설치 | SoX 또는 install command 안내 |
| 마이크 권한 거부 | OS 설정 경로 안내 |
| 원격 환경 조회 실패 | 에러 다이얼로그 표시 |
| 조직 정책 차단 | 브리지 시작 거부 |

- 사용자 노출 메시지:
  - `Session transferred to Claude Desktop`
  - `Voice mode enabled. Hold ... to record.`
  - `No remote environments available.`
  - `Not in remote mode. Start with claude --remote ...`
- 로그 및 감사 이력 처리:
  - 데스크톱/음성 토글/원격 환경 변경은 설정 변경과 analytics 이벤트로 추적 가능하다.
  - 브리지 시작 실패는 정책 또는 인증 오류로 기록된다.
- 연관 기능:
  - 6.2 인증 및 제공자
  - 6.3 세션
  - 6.10 MCP
- 테스트 시 검증 포인트:
  - IDE 탐지, 연결, 해제, open 흐름 검증
  - 데스크톱 미설치/구버전/정상 설치 분기 검증
  - 음성 preflight 각 단계 실패 메시지 검증
  - remote environment 0개, 1개, 다수인 경우 UI 분기 검증
  - 브리지 로그인 미완료, 정책 차단, 정상 연결 케이스 검증

### 6.10 MCP 서버 및 리소스 연동

- 기능명: MCP 서버 관리 및 자원 연동
- 기능 개요: Model Context Protocol 서버를 연결해 도구, 리소스, 프롬프트를 외부 시스템으로 확장한다. 로컬, 프로젝트, 사용자, 엔터프라이즈, managed 등 다양한 scope를 지원한다.
- 기능 목적: OpenPro 내부 기능만으로 부족한 시스템 연동을 표준 프로토콜로 확장한다.
- 사용 대상자 또는 권한 대상: 프로젝트 운영자, 고급 사용자
- 사전 조건:
  - MCP 서버 정의가 설정에 존재해야 한다.
  - transport별 실행 환경 또는 인증 정보가 준비되어야 한다.
- 진입 경로:
  - `/mcp`
  - `/mcp reconnect <server>`
  - `/mcp enable [server|all]`
  - `/mcp disable [server|all]`
  - MCP doctor 관련 내부/확장 명령
- 상세 동작 절차:
  1. 시스템은 설정 파일과 managed config에서 MCP 서버 정의를 로드한다.
  2. transport type에 따라 stdio, sse, http, ws, sdk, proxy 방식으로 연결한다.
  3. 연결이 성공하면 도구와 리소스를 런타임 툴 풀에 병합한다.
  4. `/mcp`에서 특정 서버 재연결, enable/disable, 전체 enable/disable을 수행한다.
  5. 인증이 필요한 서버는 `needs-auth` 상태를 반환한다.
  6. 자원 목록과 자원 읽기는 전용 tool로 노출된다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| scope | local, user, project, dynamic, enterprise, claudeai, managed | 우선순위와 수정 가능 범위가 다름 |
| transport | stdio, sse, sse-ide, http, ws, sdk, claudeai-proxy | transport별 필수 필드 상이 |
| headers/oauth/xaa | 인증 정보 | needs-auth 여부에 영향 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| 도구 등록 | MCP 도구를 일반 도구처럼 사용 가능 |
| 리소스 등록 | list/read resource 가능 |
| 연결 상태 | connected/failed/needs-auth/pending/disabled |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| MCP settings | 서버 목록, enable/disable, reconnect | 외부 빌드의 MCP 관리 기본 화면 |

- 유효성 검증 규칙:
  - stdio는 `command`, `args`, `env` 구성이 필요하다.
  - HTTP/SSE는 endpoint와 인증 헤더 구성이 필요할 수 있다.
  - disabled 서버는 런타임 도구 목록에 주입되지 않는다.
- 비즈니스 로직:
  - scope는 설정 출처와 수정 가능 범위를 동시에 나타낸다.
  - IDE 연동도 dynamic MCP config의 특수 케이스로 동작한다.
  - serialized CLI state에 clients, configs, tools, resources가 함께 유지된다.
- 상태값 변화:
  - disabled → pending → connected
  - connected → failed
  - pending → needs-auth
- 저장 및 수정되는 데이터:
  - settings 내 MCP 서버 정의
  - enable/disable 플래그
  - 연결 캐시 및 상태
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 서버 프로세스 시작 실패 | `failed` 상태로 전환 |
| OAuth 누락 | `needs-auth` 상태 |
| 네트워크 단절 | 재연결 전까지 실패 상태 유지 |

- 사용자 노출 메시지:
  - enable/disable/reconnect 결과 메시지
  - 인증 필요 안내
- 로그 및 감사 이력 처리:
  - 연결 실패 사유와 상태 전이는 운영 진단에서 확인 가능하다.
- 연관 기능:
  - 6.4 도구 실행
  - 6.9 IDE 연동
  - 6.11 플러그인 및 훅
- 테스트 시 검증 포인트:
  - transport 유형별 연결 성공/실패 검증
  - needs-auth 상태 전환 검증
  - enable/disable 후 도구 목록 반영 여부 확인

### 6.11 플러그인, 스킬, 훅 관리

- 기능명: 플러그인, 스킬, 훅 확장 관리
- 기능 개요: 외부 또는 로컬 플러그인을 설치·업데이트·활성화·비활성화하고, 스킬을 명시적으로 호출하거나 훅으로 이벤트 기반 동작을 추가할 수 있다.
- 기능 목적: 코어 배포본을 수정하지 않고 기능을 확장한다.
- 사용 대상자 또는 권한 대상: 프로젝트 운영자, 고급 사용자
- 사전 조건:
  - 플러그인 소스 경로, git 저장소, npm 소스 중 하나가 유효해야 한다.
  - 권한과 정책상 플러그인이 허용되어야 한다.
- 진입 경로:
  - `/plugin`
  - `/reload-plugins`
  - `/skills`
  - `/hooks`
  - plugin CLI non-interactive commands
- 상세 동작 절차:
  1. 플러그인 메타데이터와 marketplace 엔트리를 로드한다.
  2. 설치 명령은 source를 해석하고 versioned cache에 플러그인을 저장한다.
  3. scope는 user, project, local 중 하나로 지정된다.
  4. plugin settings와 option schema를 저장하고 실제 런타임에 병합한다.
  5. `/reload-plugins`는 활성 플러그인 재로딩과 캐시 무효화를 수행한다.
  6. `/skills`는 설치된 스킬 목록을 확인하고 프롬프트에 활용한다.
  7. `/hooks`는 사용 가능한 tool name을 기반으로 이벤트 트리거 훅을 설정한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| plugin source | marketplace, git, npm, local path | validation 필요 |
| plugin scope | user, project, local | 설정 적용 범위 상이 |
| option values | plugin schema 기반 사용자 값 | schema 위반 시 저장 실패 |
| hook definition | 이벤트와 실행 내용 | 현재 도구 풀과 충돌 없어야 함 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| plugin 설치/활성화 | 런타임 명령, 도구, MCP, LSP 등이 추가될 수 있음 |
| reload 완료 | 새 설정 즉시 반영 |
| hook 저장 | 해당 이벤트에 후속 동작 연결 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Plugin settings | 설치된 플러그인 목록, 상태, scope | enable/disable/update 조작 |
| Hooks screen | 이벤트와 도구 선택 UI | 사용 가능한 도구명 기반 구성 |

- 유효성 검증 규칙:
  - plugin manifest는 schema 검증을 통과해야 한다.
  - 정책에 의해 block된 plugin은 설치 또는 활성화되지 않는다.
  - missing plugin 탐지 후 startup check에서 설치 안내를 줄 수 있다.
- 비즈니스 로직:
  - plugin cache는 버전별 디렉터리로 관리된다.
  - plugin data dir는 각 플러그인별 별도 저장소를 갖는다.
  - plugin option substitution은 사용자 설정과 plugin 변수 모두 지원한다.
  - moved-to-plugin 명령은 코어 명령명을 유지하면서 실제 구현을 플러그인으로 위임한다.
- 상태값 변화:
  - 미설치 → 설치됨
  - 설치됨 → enabled/disabled
  - cache stale → refreshed
- 저장 및 수정되는 데이터:
  - installed plugins file
  - known marketplaces file
  - versioned cache path
  - plugin options 저장소
  - plugin data dir
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| manifest invalid | 설치 중단, validation error 반환 |
| plugin source fetch 실패 | 설치 실패 메시지 출력 |
| scope 불일치 | 수정 불가 범위 안내 |
| schema 위반 옵션 저장 | 설정 반영 실패 |

- 사용자 노출 메시지:
  - install/update/enable/disable 결과
  - moved-to-plugin 안내
- 로그 및 감사 이력 처리:
  - 성공/실패 telemetry가 수집될 수 있다.
  - flagged plugin은 별도 표시 및 seen 상태 관리가 가능하다.
- 연관 기능:
  - 6.10 MCP
  - 6.4 도구 실행
  - 6.12 협업 및 리뷰
- 테스트 시 검증 포인트:
  - 설치/업데이트/제거/비활성화 흐름 검증
  - 잘못된 manifest와 정책 차단 케이스 검증
  - hook 정의 후 실제 이벤트 트리거 검증
  - moved-to-plugin 명령 fallback 검증

### 6.12 협업, 리뷰, 보안 점검

- 기능명: 리뷰 및 저장소 협업 보조
- 기능 개요: 일반 PR 리뷰, 원격 정밀 리뷰, 보안 전용 리뷰, GitHub PR 댓글 조회, GitHub Actions 연동을 지원한다.
- 기능 목적: 코드 변경 검토와 협업 피드백 확인을 OpenPro 내부에서 수행하게 한다.
- 사용 대상자 또는 권한 대상: 개발자, 저장소 관리자, 보안 담당자
- 사전 조건:
  - `gh` CLI와 GitHub 인증이 준비되어 있어야 한다.
  - 원격 정밀 리뷰는 기능 활성화 및 원격 서비스 조건을 만족해야 한다.
- 진입 경로:
  - `/review`
  - `/ultrareview`
  - `/security-review`
  - `/pr-comments`
  - `/install-github-app`
- 상세 동작 절차:
  1. `/review`는 로컬 프롬프트 명령으로 `gh pr list`, `gh pr view`, `gh pr diff` 흐름을 사용해 PR을 검토한다.
  2. `/ultrareview`는 원격 웹 기반 리뷰 흐름을 사용하며 free quota 초과 시 overage permission dialog를 거칠 수 있다.
  3. `/security-review`는 현재 브랜치 diff를 기준으로 보안 관점만 집중 검토하도록 프롬프트를 구성한다.
  4. `/pr-comments`는 PR-level comments와 review comments를 `gh api`로 수집해 읽기 쉬운 형식으로 정리한다.
  5. `/install-github-app`은 GitHub 저장소에 Claude 관련 Actions 워크플로를 설치한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| PR 번호 | 선택적으로 직접 지정 | 미지정 시 목록 조회 |
| 현재 브랜치 diff | security review 입력 | `origin/HEAD...` 비교 기반 |
| GitHub repo | workflow 설치 대상 | `owner/repo` 형식 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| PR 리뷰 문서 | 코드 품질/위험/개선점 요약 |
| 보안 리뷰 보고서 | 파일, 라인, 심각도, 설명, exploit scenario, 권고안 포함 |
| PR comments 목록 | 스레드 구조와 diff hunk 포함 출력 |
| GitHub Actions 워크플로 | `.github/workflows/claude.yml`, `claude-code-review.yml` 등 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Ultrareview dialog | quota/overage 관련 안내 | 기능 활성화 시 표시 |
| GitHub Actions wizard | 저장소, secret, workflow 선택 | 설치 단계별 진행 |

- 유효성 검증 규칙:
  - `gh` 인증과 저장소 접근 권한이 없으면 관련 기능은 실패한다.
  - security review는 문서 파일, 테스트 파일, 이론적 취약점, DOS류를 제외하는 강한 false positive 필터를 사용한다.
  - PR comments는 GitHub API 응답에서 `body`, `diff_hunk`, `path`, `line` 등을 우선 사용한다.
- 비즈니스 로직:
  - `/review`는 순수 로컬 리뷰 경로다.
  - `/ultrareview`는 “Claude Code on the web” 경로로 분리된다.
  - `/security-review`와 `/pr-comments`는 코어 명령명을 유지하지만 실제로는 plugin 이관형 명령으로 구현된다.
  - GitHub Actions 설치 시 default branch SHA를 기준으로 새 브랜치를 생성하고 workflow 파일을 업로드한다.
- 상태값 변화:
  - 리뷰 미실행 → 분석 중 → 결과 생성
  - workflow 미설치 → 브랜치 생성 → 파일 생성 → 설치 완료
- 저장 및 수정되는 데이터:
  - 리뷰 결과는 세션 로그에 남는다.
  - GitHub 저장소의 workflow 파일
  - GitHub 시크릿 참조명
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| gh 미설치/미인증 | 명령 실패 메시지 출력 |
| workflow 파일 이미 존재 | 수동 업데이트 안내와 함께 실패 |
| quota 초과 | ultrareview overage dialog 또는 기능 제한 |
| GitHub API 실패 | stderr 기반 상세 오류 반환 |

- 사용자 노출 메시지:
  - `Review a pull request`
  - `fetching PR comments`
  - GitHub Actions 설치 도움말과 수동 설정 URL
- 로그 및 감사 이력 처리:
  - GitHub Actions 설치 시작/실패 이벤트가 analytics에 기록된다.
  - 보안 리뷰 결과는 일반 리뷰보다 높은 감사 가치가 있어 세션 로그 보존이 중요하다.
- 연관 기능:
  - 6.2 GitHub 인증
  - 6.11 플러그인
- 테스트 시 검증 포인트:
  - PR 번호 지정/미지정 리뷰 검증
  - security-review false positive exclusion 검증
  - pr-comments에서 PR-level, review-level, reply thread 표시 확인
  - GitHub Actions 설치에서 저장소 없음, 권한 부족, 기존 파일 존재 케이스 검증

### 6.13 로그, 모니터링, 분석, 감사

- 기능명: 로그 및 분석 운영 기능
- 기능 개요: 세션 로그, 도구 실행 로그, task 상태, analytics 이벤트, usage report, insights 리포트, runtime doctor 보고서를 제공한다.
- 기능 목적: 개발/운영/지원이 문제 재현, 비용 분석, 사용 패턴 분석, 감사 추적을 수행할 수 있게 한다.
- 사용 대상자 또는 권한 대상: 운영자, 개발자, 지원 담당자
- 사전 조건:
  - 세션 파일과 설정 파일에 접근 가능해야 한다.
  - 일부 분석은 모델 호출과 시간이 필요할 수 있다.
- 진입 경로:
  - 세션 로그 자동 기록
  - `/usage`, `/cost`, `/insights`, `/doctor`
  - `bun run doctor:runtime`, `doctor:report`, `hardening:*`
- 상세 동작 절차:
  1. 모든 대화와 도구 호출은 JSONL 세션 로그에 누적된다.
  2. stdout/stderr, task id, status, summary, reason, worktree 정보 등이 구조화 태그로 저장된다.
  3. runtime doctor는 provider env와 연결 가능성을 검사한다.
  4. insights는 프로젝트/세션 로그를 읽어 사용자 메시지 수, 도구 사용량, 파일 수정량, 언어 분포, 멀티 세션 패턴 등을 계산한다.
  5. 필요 시 고품질 모델을 사용해 요약과 서사형 분석을 생성한다.
- 입력 데이터:

| 항목 | 설명 | 제약 |
|---|---|---|
| session logs | JSONL 세션 데이터 | 로그 손상 시 일부 세션 제외 가능 |
| usage/cost source | 내부 집계 데이터 또는 API 결과 | 제공자별 세부 항목 차이 가능 |
| runtime env | provider env, base URL, auth file | doctor에서 검증 |

- 출력 결과:

| 결과 | 설명 |
|---|---|
| JSONL 세션 로그 | 원본 감사 데이터 |
| usage 화면 | 사용량 정보 |
| doctor 보고서 | 진단 결과, JSON 리포트 가능 |
| insights 리포트 | 사용 패턴, 인사이트, export 데이터 |

- 화면 구성 요소 설명:

| 화면명 | 요소 | 설명 |
|---|---|---|
| Usage tab | 사용량 정보 | Settings 내부 탭 |
| Doctor screen | 진단 체크 목록 | 오류 원인 파악 |
| Insights report | 요약/분석 텍스트 | 내부 또는 운영 리포트 |

- 유효성 검증 규칙:
  - local provider URL은 doctor에서 API key 없이도 정상으로 본다.
  - Codex provider는 `/responses` probe 기준으로 검증한다.
  - 손상된 세션 로그는 전체를 중단하지 않고 일부만 제외할 수 있다.
- 비즈니스 로직:
  - analytics는 설치 클릭, 토글, 실패 사유 등을 별도 이벤트로 기록한다.
  - insights는 원격 홈스페이스 세션 수집 기능이 내부 빌드에서만 활성화될 수 있다.
  - bootstrap 데이터는 `/api/claude_cli/bootstrap` 호출 후 전역 설정에 캐시된다.
- 상태값 변화:
  - 로그 없음 → 로그 생성
  - 진단 미수행 → 진단 완료
  - cached bootstrap 없음 → 캐시 저장됨
- 저장 및 수정되는 데이터:
  - 세션 JSONL
  - reports/doctor-runtime.json 성격의 보고서
  - global config 내 bootstrap cache, usage 힌트, analytics 카운터
- 오류 및 예외 처리 방식:

| 예외 상황 | 처리 방식 |
|---|---|
| 세션 로그 파싱 실패 | 개별 세션 스킵 또는 부분 분석 |
| doctor 네트워크 실패 | 진단 실패 결과로 표시 |
| bootstrap 5초 timeout | 캐시 갱신 생략 후 계속 진행 |

- 사용자 노출 메시지:
  - doctor/runtime 오류 메시지
  - usage 및 insights 리포트 출력
- 로그 및 감사 이력 처리:
  - 이 기능 자체가 로그·감사를 위한 핵심 기능이다.
  - 세션 식별자, 도구 id, status tag로 행위 추적이 가능하다.
- 연관 기능:
  - 6.1 CLI
  - 6.3 세션
  - 6.8 설정/상태
- 테스트 시 검증 포인트:
  - JSONL 로그 생성과 회복 가능성 검증
  - doctor JSON/plain text 출력 검증
  - insights 집계 필드 정확성 검증

## 7. API 및 외부 연동 상세 명세

### 7.1 제공자 연동

| 연동 대상 | 요청 목적 | 호출 주체 | 엔드포인트/주소 | 인증 방식 | 실패 시 처리 | 재시도/타임아웃 | 데이터 정합성 보장 |
|---|---|---|---|---|---|---|---|
| OpenAI 호환 제공자 | 채팅/응답 생성 | API client | 기본 `https://api.openai.com/v1`, 사용자가 지정한 `OPENAI_BASE_URL` | `OPENAI_API_KEY` | 즉시 실패 또는 retry | 기본 timeout `600000ms`, `withRetry` 최대 10회 | 요청 model/base URL을 provider config에서 정규화 |
| Codex backend | responses 기반 추론 | API client | 기본 `https://chatgpt.com/backend-api/codex` | `CODEX_API_KEY` 또는 `auth.json`, account id | 인증 누락/계정 ID 누락 시 시작 차단 | `/responses` probe, retry 정책 적용 | alias 모델을 실제 모델명으로 해석 |
| Gemini | 추론 | API client | SDK/provider abstraction | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` | 환경 검증 실패 | retry/timeout 공통 적용 | user env 검증 선행 |
| GitHub Models | 추론 | API client | GitHub Models OpenAI shim 경로 | `GITHUB_TOKEN` 또는 secure storage hydrate | 토큰 누락 시 실패 | retry/timeout 공통 적용 | secure storage에서 env 복원 |
| Anthropic bootstrap | 부가 구성 조회 | bootstrap client | `/api/claude_cli/bootstrap` | Claude.ai 인증 | 실패 시 캐시 갱신 생략 | 5초 timeout | client_data와 additional_model_options를 캐시 |

### 7.2 GitHub 인증 및 저장소 연동

| 기능 | 요청 목적 | 엔드포인트/명령 | 인증 방식 | 실패 응답 | 비고 |
|---|---|---|---|---|---|
| GitHub device flow | GitHub Models 로그인 | `https://github.com/login/device/code`, `https://github.com/login/oauth/access_token` | device code, PAT | 오류 단계로 전환 | 기본 scope `read:user,models:read` |
| PR 조회/댓글 조회 | 리뷰/코멘트 수집 | `gh pr list`, `gh pr view`, `gh pr diff`, `gh api /repos/.../issues/.../comments`, `gh api /repos/.../pulls/.../comments` | gh auth | stderr 반환 | `/review`, `/pr-comments` 사용 |
| GitHub Actions 설치 | workflow 파일 생성 | `gh api repos/.../contents/...`, `git/ref/heads/...` | gh auth + repo/workflow 권한 | 상세 오류와 도움말 | 워크플로 파일 존재 시 수동 대응 요구 |

### 7.3 MCP 및 원격 환경 연동

| 기능 | 요청 목적 | 호출 주체 | 전송 방식 | 인증 | 실패 처리 |
|---|---|---|---|---|---|
| MCP stdio | 로컬 프로세스 도구/리소스 연결 | MCP runtime | stdio | 없음 또는 프로세스 env | 프로세스 실패 시 `failed` |
| MCP SSE/HTTP/WS | 원격 MCP 서버 연결 | MCP runtime | sse, http, ws | headers, oauth, xaa | `needs-auth` 또는 `failed` |
| 원격 환경 목록 조회 | 기본 원격 환경 선택 | `/remote-env` | Claude.ai 연동 API abstraction | 로그인 세션 | 에러 다이얼로그 |
| 브리지 원격 제어 | 원격 세션 연결 | `remote-control` 프로세스 | 전용 브리지 프로토콜 | Claude.ai OAuth + 정책 허용 | 시작 거부 |

### 7.4 재시도 및 타임아웃 정책

| 항목 | 정책 |
|---|---|
| 기본 API timeout | `600000ms`, 환경 변수 `API_TIMEOUT_MS`로 조정 가능 |
| bootstrap timeout | `5000ms` |
| retry 대상 | `408`, `409`, `429`, `5xx`, 연결 오류, 일부 인증/속도 제한 오류 |
| retry 횟수 | 기본 최대 10회 |
| 속도 제한 처리 | OpenAI 스타일 reset duration 해석 가능 |
| unattended retry | `CLAUDE_CODE_UNATTENDED_RETRY`로 장기 재시도 성향 제어 가능 |

## 8. 공통 예외 및 오류 처리 정책

| 분류 | 예외 케이스 | 사용자 노출 방식 | 내부 처리 방식 |
|---|---|---|---|
| 입력 오류 | 잘못된 파일명, 잘못된 session id, 설정 문법 오류 | 즉시 텍스트 오류 | 기존 상태 유지, 일부는 fallback |
| 권한 부족 | 파일 시스템 권한 없음, 정책 차단, 승인 거부 | 승인 대화상자 또는 차단 메시지 | 도구 호출 중단 |
| 데이터 없음 | 세션 없음, 원격 환경 없음, MCP 리소스 없음 | 빈 결과 메시지 | 예외가 아닌 정상 빈 상태로 처리 |
| 중복 요청 | workflow 파일 이미 존재, 이미 연결된 브리지 | 경고 또는 명시적 실패 | 새 작업 생성 방지 |
| 외부 연동 실패 | gh API 오류, 브라우저 열기 실패, MCP 인증 누락 | 상세 오류 문구 또는 URL 안내 | 상태 `failed`/`needs-auth` 전환 |
| 시스템 장애 | 설정 파일 손상, 세션 로그 손상 | 경고 후 일부 기능 제한 | 백업 생성, 손상 파일 보존 |

## 9. 권한 및 보안 정책 요약

| 항목 | 정책 |
|---|---|
| 민감 자격 증명 저장 | macOS는 Keychain 우선, 그 외는 평문 저장소 fallback 가능 |
| 평문 저장 시 보호 | `chmod 600` 수준으로 보호, 경고 반환 |
| 위험 명령 통제 | permission rules와 classifier로 통제 |
| 자동 모드 안전장치 | wildcard, 인터프리터, powershell launcher, agent allow rule 제거 |
| 원격 제어 | 로그인, 버전, GrowthBook gate, 조직 정책 모두 만족 시에만 허용 |
| 데이터 마스킹 | 일부 display 함수에서 secret redaction 수행 |
| 감사 로그 | 세션 JSONL, task id, status tag, tool stdout/stderr를 통해 추적 가능 |

## 10. 데이터 모델 및 관계 요약

### 10.1 주요 엔터티

| 엔터티 | 주요 필드 | 관계 |
|---|---|---|
| Session | `sessionId`, `projectPath`, `messages`, `summary`, `tags`, `title` | Task, Agent log, Export, Insights의 기준 데이터 |
| Task | `id`, `type`, `status`, `startTime`, `sessionId` | Session에 종속, Detail dialog와 연결 |
| ProviderProfile | `provider`, `model`, `baseUrl`, `apiKey ref`, `goal` | CLI startup에서 env 생성 |
| MCPServerConfig | `scope`, `transport`, `headers`, `oauth`, `enabled` | MCP client 및 tool/resource에 연결 |
| ScheduledTask | `id`, `cron`, `prompt`, `createdAt`, `lastFiredAt`, `recurring`, `permanent`, `durable`, `agentId` | 스케줄러가 주기적 평가 |
| PluginInstallation | `pluginId`, `scope`, `version`, `source`, `enabled` | plugin options, data dir와 연결 |

### 10.2 데이터 저장 시점

| 데이터 | 저장 시점 |
|---|---|
| 세션 메시지 | 대화 진행 중 지속 저장 |
| 세션 메타데이터 | 제목/태그/요약 변경 시 |
| 설정 | 설정 변경 즉시 |
| provider profile | `/provider` 완료 시 |
| GitHub token | onboard 완료 시 |
| scheduled task | 생성/수정/삭제 시 |
| plugin options | 옵션 저장 시 |

## 11. 테스트 전략 및 공통 검증 체크리스트

### 11.1 정상 케이스

- 각 제공자에서 기본 대화 시작 가능 여부
- 파일 읽기/수정/쓰기/검색/셸 실행 정상 여부
- `/resume`, `/export`, `/memory`, `/tasks`, `/mcp`, `/plugin`, `/ide`, `/desktop`, `/voice` 정상 흐름
- GitHub Models onboarding, GitHub Actions 설치, Slack 앱 열기

### 11.2 경계값 케이스

- 세션 첫 메시지 50자 초과 export 파일명
- remote environment 0개, 1개, 다수
- 백그라운드 작업 0개, 1개, 다수
- cron day-of-month와 day-of-week 동시 조건
- settings 검색 모드에서 Esc 처리

### 11.3 예외 케이스

- 잘못된 API key, auth.json 부재, account id 누락
- 세션 로그 손상, 설정 파일 손상, secure storage 저장 실패
- gh 권한 부족, workflow 파일 충돌, 브라우저 열기 실패
- MCP needs-auth, transport 연결 실패, IDE timeout
- 마이크 권한 거부, 녹음 도구 미설치

### 11.4 권한별 케이스

- 일반 모드와 plan mode의 동작 차이
- auto mode 진입 시 위험 규칙 제거 확인
- 조직 정책으로 remote-control 금지된 상태
- user/project/local/managed 설정 충돌 시 우선순위 확인

### 11.5 연동 실패 케이스

- OpenAI base URL 연결 실패와 retry 동작
- Codex `/responses` probe 실패
- GitHub device flow timeout
- MCP 서버 프로세스 비정상 종료
- Desktop handoff deep link 실패

## 12. 부록 A: 공개 명령 인벤토리

| 명령 | 기능 요약 | 주 사용 목적 |
|---|---|---|
| `add-dir` | 추가 디렉터리를 컨텍스트에 포함 | 프로젝트 외 경로 참조 |
| `advisor` | 조언/추천 성격의 보조 흐름 | 내부/고급 작업 보조 |
| `agents` | 에이전트 관련 화면 | 서브에이전트 관리 |
| `branch` | 브랜치/워크트리 관련 작업 | 병렬 작업 분기 |
| `btw` | 보조 UX 명령 | 작업 도우미 성격 |
| `chrome` | Chrome/브라우저 연동 | 브라우저 기반 기능 |
| `clear` | 현재 대화 초기화 | 컨텍스트 리셋 |
| `color` | 색상 설정 | UI 개인화 |
| `compact` | 대화 압축 | 컨텍스트 길이 최적화 |
| `config` | 설정 탭 열기 | 설정 변경 |
| `context` | 현재 컨텍스트 관리 | 포함 경로 확인 |
| `copy` | 응답/내용 복사 | 클립보드 활용 |
| `cost` | 비용 정보 확인 | 운영 점검 |
| `desktop` | Claude Desktop으로 세션 전환 | 클라이언트 이동 |
| `diff` | 변경 사항 확인 | 코드 비교 |
| `doctor` | 런타임 진단 | 환경 점검 |
| `effort` | 추론 강도 조정 | 품질/속도 조절 |
| `exit` | 종료 | 세션 종료 |
| `export` | 대화 내보내기 | 기록 공유 |
| `extra-usage` | 추가 사용량 관련 화면 | 과금/한도 관리 |
| `fast` | 빠른 모드 설정 | 응답 속도 우선 |
| `feedback` | 피드백 제출 | 제품 개선 |
| `files` | 파일/컨텍스트 화면 | 파일 대상 작업 |
| `heapdump` | 메모리 덤프 | 디버깅 |
| `help` | 도움말 | 명령 안내 |
| `hooks` | 훅 설정 | 이벤트 자동화 |
| `ide` | IDE 연결/열기 | 개발 환경 연동 |
| `init` | 초기화 작업 | 저장소/프로젝트 준비 |
| `install-github-app` | GitHub Actions 설치 | 저장소 자동화 |
| `install-slack-app` | Slack 앱 설치 페이지 열기 | 협업 연동 |
| `insights` | 사용 인사이트 | 운영 분석 |
| `keybindings` | 키바인딩 안내 | 사용성 점검 |
| `login` | Claude.ai 로그인 | 인증 |
| `logout` | 로그아웃 | 인증 해제 |
| `mcp` | MCP 서버 관리 | 외부 도구 연동 |
| `memory` | 메모리 파일 편집 | 장기 컨텍스트 |
| `mobile` | 모바일 관련 핸드오프/안내 | 멀티 디바이스 |
| `model` | 모델 변경 | 추론 모델 전환 |
| `onboard-github` | GitHub Models 설정 | 대체 모델 인증 |
| `output-style` | 출력 스타일 조정 | 응답 형태 개인화 |
| `permissions` | 허용/거부 규칙 관리 | 안전 실행 |
| `plan` | 계획 모드 진입/열기 | 실행 전 계획 |
| `plugin` | 플러그인 관리 | 확장 |
| `pr-comments` | PR 댓글 조회 | 리뷰 확인 |
| `privacy-settings` | 개인정보/원격 설정 | 보안/개인화 |
| `provider` | 제공자 프로필 설정 | API 백엔드 전환 |
| `rate-limit-options` | 속도 제한 대응 옵션 | 안정성 조정 |
| `release-notes` | 릴리즈 노트 보기 | 변경 사항 확인 |
| `reload-plugins` | 활성 플러그인 재로드 | 설정 반영 |
| `rename` | 세션 이름 변경 | 이력 관리 |
| `resume` | 세션 재개 | 작업 이어가기 |
| `review` | PR 리뷰 | 코드 검토 |
| `rewind` | 이전 상태로 되돌리기 | 대화 조정 |
| `sandbox` | 샌드박스 관련 기능 | 안전 실행 |
| `security-review` | 보안 전용 리뷰 | 취약점 점검 |
| `session` | 원격 세션 QR/URL 보기 | 세션 공유 |
| `skills` | 스킬 관련 기능 | 전문화 워크플로 |
| `stats` | 통계 보기 | 운영 정보 |
| `status` | 상태 탭 열기 | 운영 상태 |
| `statusline` | 상태라인 설정 | 셸 통합 |
| `stickers` | 부가 UI 기능 | UX 확장 |
| `tag` | 세션 태그 설정 | 이력 관리 |
| `tasks` | 백그라운드 작업 관리 | 장기 실행 |
| `terminal-setup` | 터미널 호환 설정 | 입력 안정화 |
| `theme` | 테마 변경 | UI 개인화 |
| `think-back` | 회고/특수 UX | 내부 보조 흐름 |
| `thinkback-play` | thinkback 재생 | UX 확장 |
| `upgrade` | 업그레이드 | 버전 갱신 |
| `usage` | 사용량 확인 | 한도/활동 파악 |
| `ultrareview` | 원격 정밀 리뷰 | 심층 버그 탐지 |
| `vim` | Vim 모드 관련 설정 | 키 입력 스타일 |
| `voice` | 음성 모드 토글 | 음성 입력 |

## 13. 부록 B: 내부/빌드 조건 기능

| 기능/명령 | 노출 조건 | 설명 |
|---|---|---|
| `daemon` | build flag | 장기 supervisor 프로세스 |
| `--daemon-worker` | build flag | 데몬 워커 빠른 경로 |
| `remote-control`, `rc`, `bridge`, `sync` | bridge 기능 활성, 로그인, 정책 허용 | 원격 제어 브리지 |
| `ps`, `logs`, `attach`, `kill`, `--bg` | BG sessions 기능 활성 | 백그라운드 세션 관리 |
| `new`, `list`, `reply` | templates 기능 활성 | 템플릿 작업 |
| `environment-runner` | 기능 활성 | headless BYOC runner |
| `self-hosted-runner` | 기능 활성 | 자체 호스팅 runner |
| `agents-platform`, `autofix-pr`, `bridge-kick`, `init-verifiers`, `mock-limits`, `summary`, `ant-trace` 등 | 내부 빌드 또는 ant 전용 | 운영·실험·검증 목적 명령 |
| `monitor_mcp`, `workflow_scripts`, `dream task` | feature flag | 작업/모니터 세부 기능 확장 |

## 14. 문서 활용 가이드

- 기획자는 6장 각 기능군의 목적, 상태값 변화, 연관 기능을 기준으로 요구사항과 화면 흐름을 설계한다.
- 개발자는 4장 저장 구조와 7장 연동 명세, 10장 데이터 모델을 기준으로 구현 범위를 확정한다.
- QA는 11장 테스트 전략을 기반으로 정상·경계·예외·권한·연동 실패 시나리오를 작성한다.
- 운영자와 고객지원은 8장 공통 예외 정책, 6.8 상태/진단, 6.13 로그/분석 절을 우선 참고한다.
