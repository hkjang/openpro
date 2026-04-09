# OpenPro API 및 외부 연동 명세서

## 1. 문서 목적

이 문서는 OpenPro가 외부 시스템과 통신하는 지점을 API와 연동 관점에서 분리 정리한 문서다. 설계 전반은 [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)를 따르며, 본 문서는 요청 목적, 호출 주체, 인증 방식, 실패 처리, 재시도 정책을 중심으로 설명한다.

## 2. 연동 구성도

| 연동 영역 | 대표 대상 |
|---|---|
| 모델 제공자 | OpenAI 호환 API, Codex backend, Gemini, GitHub Models |
| 인증 | Claude.ai OAuth, GitHub device flow, secure storage |
| 저장소 협업 | GitHub CLI API, GitHub Actions workflow 생성 |
| 확장 프로토콜 | MCP stdio/SSE/HTTP/WS |
| 클라이언트 연동 | Claude Desktop deep link, IDE dynamic MCP |
| 원격 기능 | remote environment 선택, bridge remote control |
| 음성/로컬 의존성 | 녹음 도구, 마이크 권한 확인 |

## 3. 공통 연동 정책

### 3.1 호출 주체

| 주체 | 설명 |
|---|---|
| CLI bootstrap | 시작 시 provider 검증, bootstrap 호출 |
| API client | 실제 모델 추론 요청 전송 |
| 명령 핸들러 | GitHub, remote-env, desktop, voice 같은 개별 기능 |
| MCP runtime | 외부 MCP 서버와 장기 연결 |

### 3.2 공통 인증 원칙

| 항목 | 정책 |
|---|---|
| 우선 저장소 | macOS는 Keychain, 그 외는 fallback storage 가능 |
| 환경 변수 우선순위 | 직접 설정된 env가 우선, 저장 프로필/secure storage는 보조 수단 |
| 토큰 누락 처리 | 시작 차단 또는 기능 단위 실패 |
| 비밀정보 노출 방지 | display용 출력 시 redaction 적용 |

### 3.3 공통 재시도/타임아웃

| 항목 | 값 또는 정책 |
|---|---|
| 기본 timeout | `600000ms` |
| bootstrap timeout | `5000ms` |
| retry 횟수 | 기본 최대 10회 |
| retry 대상 상태 | `408`, `409`, `429`, `5xx`, 연결 오류, 일부 인증 오류 |
| 장기 재시도 | `CLAUDE_CODE_UNATTENDED_RETRY`에 의해 강화 가능 |

## 4. 모델 제공자 연동

### 4.1 OpenAI 호환 제공자

| 항목 | 내용 |
|---|---|
| 요청 목적 | 채팅/응답 생성 |
| 호출 주체 | API client |
| 기본 엔드포인트 | `https://api.openai.com/v1` |
| 변경 가능 항목 | `OPENAI_BASE_URL`, `OPENAI_MODEL` |
| 인증 방식 | `OPENAI_API_KEY` |
| 예외 | 로컬 주소(`localhost`, private IP 등)는 API key 없이 허용 가능 |
| 실패 시 처리 | 시작 시 환경 검증 실패 또는 추론 시 retry 후 실패 |
| 데이터 정합성 | model/base URL을 provider config에서 표준화 |

#### 요청 파라미터

| 파라미터 | 설명 |
|---|---|
| model | 실제 추론 모델명 |
| messages/input | 대화 또는 응답 입력 |
| headers | session id, user agent, 선택적 remote/container id |

#### 실패 응답 처리

| 유형 | 처리 |
|---|---|
| 인증 실패 | 즉시 실패 또는 일부 경우 토큰 갱신 시도 |
| 속도 제한 | reset duration 해석 후 retry |
| 연결 실패 | retry 후 최종 오류 반환 |

### 4.2 Codex backend

| 항목 | 내용 |
|---|---|
| 요청 목적 | Codex 계열 모델을 responses 방식으로 호출 |
| 호출 주체 | API client |
| 기본 엔드포인트 | `https://chatgpt.com/backend-api/codex` |
| 인증 방식 | `CODEX_API_KEY` 또는 `auth.json`, account id |
| 인증 소스 | `~/.codex/auth.json`, `CODEX_AUTH_JSON_PATH`, `CODEX_HOME`, env |
| 모델 alias | `codexplan`, `codexspark` 등 |
| 실패 시 처리 | 인증 누락 시 시작 차단, `/responses` probe 실패 시 doctor 실패 |

#### 인증 필수 조건

| 항목 | 필수 여부 |
|---|---|
| API key 또는 auth token | 필수 |
| account id | 필수 |
| model | 필수 |

#### 데이터 정합성 보장

- alias 모델을 실제 모델명으로 해석한다.
- transport를 `codex_responses`로 강제해 잘못된 채팅 경로 사용을 방지한다.

### 4.3 Gemini

| 항목 | 내용 |
|---|---|
| 요청 목적 | Gemini 모델 추론 |
| 인증 방식 | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` |
| 호출 방식 | provider abstraction |
| 시작 전 검증 | 키 누락 시 즉시 실패 |
| 실패 처리 | 일반 retry 정책 적용 |

### 4.4 GitHub Models

| 항목 | 내용 |
|---|---|
| 요청 목적 | GitHub Models를 OpenAI shim처럼 사용 |
| 인증 방식 | `GITHUB_TOKEN` 또는 `GH_TOKEN`, 또는 secure storage hydrate |
| 설정 경로 | `/onboard-github` |
| 저장 방식 | secure storage 우선 |
| 실패 처리 | 토큰 누락 시 provider 검증 실패 |

## 5. Claude.ai 관련 연동

### 5.1 OAuth 로그인

| 항목 | 내용 |
|---|---|
| 요청 목적 | Claude.ai 계정 로그인 |
| 호출 주체 | `/login` |
| 인증 방식 | console OAuth flow |
| 성공 후 후처리 | managed settings refresh, policy limits refresh, GrowthBook refresh, trusted device 처리 |
| 실패 처리 | 로그인 미완료 상태 유지 |

### 5.2 Bootstrap

| 항목 | 내용 |
|---|---|
| 요청 목적 | 부가 모델 옵션과 클라이언트 데이터 수신 |
| 엔드포인트 | `/api/claude_cli/bootstrap` |
| 호출 조건 | first-party provider 사용, nonessential traffic 허용 |
| timeout | 5초 |
| 저장 | global config cache |

### 5.3 Remote Environment 선택

| 항목 | 내용 |
|---|---|
| 요청 목적 | Claude.ai 측 원격 실행 환경 목록 조회 및 기본값 저장 |
| 호출 주체 | `/remote-env` |
| 인증 방식 | 로그인 세션 |
| 저장 위치 | local settings의 `remote.defaultEnvironmentId` |
| 실패 처리 | 다이얼로그 에러 표시 |

## 6. GitHub 연동

### 6.1 GitHub Models device flow

| 항목 | 내용 |
|---|---|
| 요청 목적 | GitHub Models 사용을 위한 사용자 인증 |
| 엔드포인트 | `https://github.com/login/device/code`, `https://github.com/login/oauth/access_token` |
| 호출 주체 | `/onboard-github` |
| 입력 | client 정보, scope |
| 출력 | `device_code`, `user_code`, `verification_uri`, access token |
| scope | `read:user,models:read` |
| 실패 처리 | 오류 화면으로 전환 |

#### 저장 후 처리

1. 토큰을 secure storage에 저장
2. user settings에 `CLAUDE_CODE_USE_GITHUB=1` 저장
3. `OPENAI_MODEL` 기본값으로 `github:copilot` 저장
4. 환경 변수 hydrate

### 6.2 PR 리뷰 및 댓글 조회

| 기능 | 호출 명령 | 결과 |
|---|---|---|
| `/review` | `gh pr list`, `gh pr view`, `gh pr diff` | PR 리뷰 프롬프트 생성 |
| `/pr-comments` | `gh api /repos/{owner}/{repo}/issues/{number}/comments`, `gh api /repos/{owner}/{repo}/pulls/{number}/comments` | 댓글 스레드 포맷 결과 |
| `/security-review` | `git diff`, `git log`, `git status` 등 | 보안 리뷰 입력 생성 |

#### 실패 처리

| 케이스 | 처리 |
|---|---|
| `gh` 미설치 | 명령 실패 |
| gh auth 없음 | stderr 기반 오류 표시 |
| 저장소 접근 권한 없음 | 상세 오류 반환 |

### 6.3 GitHub Actions 설치

| 항목 | 내용 |
|---|---|
| 요청 목적 | Claude 관련 workflow 파일을 GitHub 저장소에 추가 |
| 호출 주체 | `/install-github-app` |
| 필수 권한 | repo, workflow, 저장소 admin 수준 접근 |
| 주요 호출 | `repos/{repo}`, `repos/{repo}/git/ref/heads/{defaultBranch}`, `repos/{repo}/contents/{workflowPath}` |
| 생성 대상 | `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml` 등 |
| 브랜치 전략 | `add-claude-github-actions-<timestamp>` |
| 실패 처리 | 도움말 포함 오류 반환 |

#### 요청 파라미터

| 파라미터 | 설명 |
|---|---|
| repoName | `owner/repo` |
| secretName | workflow에서 참조할 secret 이름 |
| selectedWorkflows | 생성할 workflow 목록 |
| authType | `api_key` 또는 `oauth_token` |

#### 데이터 정합성 보장

- workflow 파일 존재 여부를 먼저 조회해 SHA를 확보한다.
- 기존 파일이 있으면 SHA 기반 업데이트 또는 중복 오류를 반환한다.
- secret 이름에 따라 workflow 템플릿 내 secret 참조를 치환한다.

## 7. MCP 연동

### 7.1 연동 유형

| transport | 설명 | 주요 필드 |
|---|---|---|
| stdio | 로컬 프로세스를 통한 연결 | `command`, `args`, `env` |
| sse | 서버 sent events | endpoint, headers, oauth |
| sse-ide | IDE 전용 SSE 변형 | IDE 동적 연결에 사용 가능 |
| http | HTTP 요청 기반 | endpoint, headers |
| ws | websocket | endpoint, headers |
| sdk | SDK 래핑 | SDK 설정 |
| claudeai-proxy | Claude.ai 프록시 경유 | 로그인/정책에 의존 가능 |

### 7.2 상태 및 실패 정책

| 상태 | 의미 | 운영 대응 |
|---|---|---|
| connected | 정상 연결 | 그대로 사용 |
| pending | 연결 시도 중 | 일정 시간 후 재확인 |
| needs-auth | 인증 필요 | OAuth 또는 token 설정 |
| failed | 연결 실패 | endpoint/프로세스 로그 확인 |
| disabled | 비활성화 | 설정에서 enable 필요 |

### 7.3 데이터 정합성

- MCP 서버 정의는 scope별로 분리되며 최종 런타임 구성으로 병합된다.
- disable된 서버는 도구 목록에 주입되지 않는다.
- IDE 연동 역시 dynamic MCP config로 취급할 수 있다.

## 8. Desktop, IDE, Voice 연동

### 8.1 Claude Desktop

| 항목 | 내용 |
|---|---|
| 목적 | 현재 CLI 세션을 Desktop에서 이어서 사용 |
| 사전 점검 | 설치 여부, 최소 버전 `v1.1.2396+` |
| 다운로드 URL | Windows는 `https://claude.ai/api/desktop/win32/x64/exe/latest/redirect`, 그 외는 mac 계열 다운로드 URL |
| 성공 전 처리 | session storage flush |
| 최종 동작 | deep link로 Desktop 실행 후 CLI graceful shutdown |

### 8.2 IDE 연결

| 항목 | 내용 |
|---|---|
| 목적 | IDE 확장과 OpenPro를 연결 |
| 연결 방식 | dynamic MCP config `ide` |
| 타임아웃 | 35초 |
| 실패 처리 | 설치 옵션 안내 또는 연결 불가 메시지 |

### 8.3 Voice

| 항목 | 내용 |
|---|---|
| 목적 | push-to-talk 음성 입력 |
| 필수 조건 | Claude.ai 로그인, voice mode enabled gate, 마이크 권한, 녹음 도구 |
| 의존 도구 | SoX 또는 별도 install command가 제시하는 도구 |
| 실패 처리 | 권한 경로 또는 설치 명령 안내 |
| 저장 | `voiceEnabled`, language hint count |

## 9. Bridge 원격 제어

| 항목 | 내용 |
|---|---|
| 목적 | 로컬 터미널을 원격 제어 세션에 연결 |
| 진입 명령 | `openpro remote-control`, `rc`, `bridge`, `sync` |
| 필수 조건 | Claude.ai 로그인, GrowthBook gate 허용, 최소 버전 충족, 정책 허용 |
| 정책 키 | `allow_remote_control` |
| 실패 처리 | 즉시 오류 출력 후 시작 차단 |

## 10. 데이터 정합성과 저장 정책

| 데이터 | 정합성 전략 |
|---|---|
| provider profile | 시작 전 검증 후 env 반영 |
| bootstrap cache | 짧은 timeout 후 캐시 저장, 실패 시 이전 상태 유지 |
| GitHub token | secure storage 저장 후 hydrate |
| workflow 파일 | GitHub API로 SHA 조회 후 PUT |
| remote environment 기본값 | 선택 즉시 local settings 저장 |
| MCP 설정 | scope와 enable 상태 기반 병합 |

## 11. 운영 점검 체크리스트

- API timeout과 retry 정책이 의도대로 적용되는지 확인
- 외부 인증 만료가 있는지 확인
- GitHub Actions 설치 후 workflow 파일이 정상 생성되었는지 확인
- MCP 서버가 `connected`인지 확인
- remote-control이 조직 정책에 의해 차단되지 않았는지 확인

## 12. 연계 문서

- 기능 기준 문서: [openpro-functional-spec-ko.md](D:/project/openpro/docs/openpro-functional-spec-ko.md)
- 운영 절차 문서: [openpro-operations-manual-ko.md](D:/project/openpro/docs/openpro-operations-manual-ko.md)
- QA 테스트 문서: [openpro-qa-test-cases-ko.md](D:/project/openpro/docs/openpro-qa-test-cases-ko.md)
