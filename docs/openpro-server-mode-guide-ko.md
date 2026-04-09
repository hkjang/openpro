# OpenPro 서버 기동 가이드

## 1. 이 문서가 답하는 질문

이 문서는 다음 질문에 답하기 위해 작성했다.

- OpenPro를 서버처럼 띄우는 방법이 실제로 있는가
- 있다면 어떤 명령으로 실행하는가
- 이 서버는 일반 REPL과 무엇이 다른가
- `remote-control`과는 어떻게 다른가
- 실제 연결은 어떤 방식으로 이루어지는가
- 현재 소스 스냅샷 기준으로 어디까지 확실하게 확인할 수 있는가

짧게 먼저 답하면 다음과 같다.

- 소스 기준으로는 `server` 서브커맨드가 있다.
- 다만 이 기능은 `DIRECT_CONNECT` feature gate 뒤에 있어서 빌드에 따라 노출되지 않을 수 있다.
- 현재 체크아웃에는 `src/server/createDirectConnectSession.ts`, `src/server/directConnectManager.ts`, `src/server/types.ts`는 있지만, `main.tsx`가 import하는 실제 서버 구현 파일 일부는 보이지 않는다.
- 따라서 “CLI 엔트리와 연결 프로토콜은 확인 가능”하지만, “서버 내부 구현 전체를 이 체크아웃만으로 완전 검증”할 수는 없다.

---

## 2. 결론 먼저

### 2.1 서버 모드는 있다

`src/main.tsx`에는 아래 조건으로 `server` 명령이 등록된다.

- `feature('DIRECT_CONNECT')`가 켜져 있을 때

실제 등록 코드는 [main.tsx](D:/project/openpro/src/main.tsx:3944) 부근에 있다.

핵심 옵션은 다음과 같다.

- `--port <number>`
- `--host <string>`
- `--auth-token <token>`
- `--unix <path>`
- `--workspace <dir>`
- `--idle-timeout <ms>`
- `--max-sessions <n>`

### 2.2 설치 바이너리 이름은 `openpro`

소스 내부 도움말과 `program.name()` 쪽에는 상속된 `claude` 문자열이 많이 남아 있지만, 이 저장소의 실제 패키지 바이너리는 `openpro`다. 따라서 사용자는 아래처럼 실행하면 된다.

```bash
openpro server
```

관련 근거:

- [package.json](D:/project/openpro/package.json:6)
- [main.tsx](D:/project/openpro/src/main.tsx:3944)

---

## 3. 어떤 종류의 서버인가

이 서버는 “HTTP + WebSocket 기반으로 OpenPro 세션을 외부 클라이언트가 붙을 수 있게 만드는 direct connect session server”에 가깝다.

소스상 확인되는 연결 흐름은 다음과 같다.

1. 서버가 `/sessions`로 새 세션 생성 요청을 받는다.
2. 클라이언트는 `cwd`와 옵션을 보내 세션을 만든다.
3. 서버는 `session_id`, `ws_url`, `work_dir`를 돌려준다.
4. 이후 실제 메시지 송수신과 permission prompt 왕복은 WebSocket으로 진행된다.

이 부분은 아래 파일에서 확인할 수 있다.

- 세션 생성 요청: [createDirectConnectSession.ts](D:/project/openpro/src/server/createDirectConnectSession.ts)
- 응답 schema: [types.ts](D:/project/openpro/src/server/types.ts)
- WS 연결 관리자: [directConnectManager.ts](D:/project/openpro/src/server/directConnectManager.ts)

---

## 4. `server`와 `remote-control`은 다르다

이 둘은 이름만 비슷하고 목적이 다르다.

| 구분 | `openpro server` | `openpro remote-control` |
|---|---|---|
| 목적 | direct connect 방식의 세션 서버 | Claude 웹/앱과 연계되는 원격 제어 브리지 |
| 진입 조건 | `DIRECT_CONNECT` feature gate | 별도 bridge/remote-control 경로 |
| 연결 방식 | `/sessions` + `ws_url` | Claude.ai/code 세션 API와 bridge |
| 사용 시점 | 로컬/사내 환경에서 직접 세션 서버처럼 운용하고 싶을 때 | 웹/모바일에서 이어서 작업하고 싶을 때 |
| 소스 중심 파일 | `src/server/*`, `main.tsx`의 server/open/cc:// 경로 | `src/bridge/*`, `main.tsx`의 remote-control 경로 |

`remote-control`은 [bridgeMain.ts](D:/project/openpro/src/bridge/bridgeMain.ts:1908)에서 스스로를 “persistent server that accepts multiple concurrent sessions”라고 설명하지만, 그 의미는 direct connect용 HTTP/WS 세션 서버라기보다 Claude 웹 서비스와 연결된 브리지 런타임에 가깝다.

즉:

- 로컬에서 직접 붙는 세션 서버가 필요하면 `server`
- Claude 웹/앱과 이어서 쓰는 흐름이면 `remote-control`

로 구분해서 보면 된다.

---

## 5. 서버 기동 방법

### 5.1 가장 단순한 실행

```bash
openpro server
```

소스상 기본값은 다음과 같다.

- host: `0.0.0.0`
- port: `0`
- idle timeout: `600000` 밀리초
- max sessions: `32`

즉 기본 실행만 해도 포트는 자동 할당되고, 네트워크 인터페이스는 모든 주소로 바인딩될 수 있다.

### 5.2 로컬에서만 안전하게 열기

서버를 외부에 노출할 계획이 없으면 아래처럼 실행하는 편이 안전하다.

```bash
openpro server --host 127.0.0.1 --port 8080
```

이유는 다음과 같다.

- 기본 host가 `0.0.0.0`이라 외부 인터페이스에 노출될 수 있다.
- 내부 backend 이름이 `DangerousBackend`인 점에서도 알 수 있듯, 이 기능은 보안 격리가 강한 멀티테넌트 서버라기보다 “신뢰된 환경에서 직접 연결” 용도에 가깝다.

관련 근거:

- [main.tsx](D:/project/openpro/src/main.tsx:3945)

### 5.3 고정 토큰을 지정해서 실행

```bash
openpro server --host 127.0.0.1 --port 8080 --auth-token "my-strong-token"
```

`--auth-token`을 지정하지 않으면 소스상 서버는 랜덤 토큰을 생성한다.

```ts
const authToken = opts.authToken ?? `sk-ant-cc-${randomBytes(16).toString('base64url')}`
```

관련 근거:

- [main.tsx](D:/project/openpro/src/main.tsx:3982)

### 5.4 기본 작업 디렉터리 지정

```bash
openpro server --host 127.0.0.1 --port 8080 --workspace "D:\\project\\openpro"
```

`workspace`는 세션 생성 시 별도 `cwd`를 보내지 않았을 때 사용할 기본 작업 디렉터리다.

관련 근거:

- [types.ts](D:/project/openpro/src/server/types.ts:22)
- [main.tsx](D:/project/openpro/src/main.tsx:3945)

### 5.5 Unix domain socket으로 열기

소스상 `--unix <path>` 옵션이 있다.

```bash
openpro server --unix /tmp/openpro.sock
```

다만 현재 사용 환경이 Windows라면 이 옵션은 일반적인 Windows 사용자 입장에서는 실용성이 낮을 수 있다. 이 옵션은 Linux/macOS 또는 Unix socket을 직접 다루는 환경에서 더 자연스럽다.

### 5.6 idle timeout과 세션 수 조정

```bash
openpro server --host 127.0.0.1 --port 8080 --idle-timeout 0 --max-sessions 4
```

의미:

- `--idle-timeout 0`: idle 만료 없음
- `--max-sessions 4`: 동시 세션 최대 4개

관련 근거:

- [main.tsx](D:/project/openpro/src/main.tsx:3945)

---

## 6. 실제 연결 방식

### 6.1 세션 생성 요청

클라이언트 쪽 `createDirectConnectSession()`은 서버에 아래 요청을 보낸다.

- method: `POST`
- path: `/sessions`
- body: `cwd`, 선택적으로 `dangerously_skip_permissions`

응답은 다음 구조로 검증된다.

- `session_id`
- `ws_url`
- `work_dir` 선택적

관련 소스:

- [createDirectConnectSession.ts](D:/project/openpro/src/server/createDirectConnectSession.ts:49)
- [types.ts](D:/project/openpro/src/server/types.ts:5)

### 6.2 WebSocket 연결

세션 생성 이후 `DirectConnectSessionManager`가 `ws_url`로 WebSocket을 연다.

이때:

- auth token이 있으면 `Authorization: Bearer ...` 헤더를 붙인다.
- `control_request` 중 `can_use_tool`은 permission request로 처리한다.
- 일반 assistant/system/result 류 메시지는 UI 쪽으로 forward한다.
- 사용자 입력은 SDK user message 형식의 JSON으로 보낸다.
- interrupt도 control request 형식으로 별도 보낸다.

관련 소스:

- [directConnectManager.ts](D:/project/openpro/src/server/directConnectManager.ts:43)

---

## 7. 연결하는 방법

### 7.1 소스상 확인되는 연결 경로

소스상 direct connect 경로는 두 가지가 보인다.

1. `cc://` 또는 `cc+unix://` URL을 argv에서 직접 감지해 main path로 rewrite
2. 내부 `open <cc-url>` 서브커맨드 사용

관련 근거:

- `cc://` 감지: [main.tsx](D:/project/openpro/src/main.tsx:610)
- 내부 `open` 명령: [main.tsx](D:/project/openpro/src/main.tsx:4042)

### 7.2 중요한 주의사항

현재 체크아웃에는 아래 파일이 보이지 않는다.

- `src/server/parseConnectUrl.js` 또는 `.ts`
- `src/server/server.js` 또는 `.ts`
- `src/server/sessionManager.js` 또는 `.ts`
- `src/server/backends/dangerousBackend.js` 또는 `.ts`
- `src/server/serverBanner.js` 또는 `.ts`
- `src/server/lockfile.js` 또는 `.ts`

즉, 엔트리 포인트와 client-side direct connect 조각은 보이지만:

- 정확한 `cc://` URL 포맷
- 서버 배너가 어떤 문자열을 출력하는지
- 서버의 실제 HTTP route 구현
- lockfile 처리 세부 로직

은 현재 소스 스냅샷만으로는 완전하게 확정할 수 없다.

문서적으로는 여기까지가 안전한 결론이다.

### 7.3 실무적으로 이해하면 좋은 점

현재 코드 기준으로 가장 보수적으로 이해하면 다음과 같다.

- 서버는 기동 시 접속용 URL 또는 토큰을 배너로 안내하도록 설계된 흔적이 있다.
- 클라이언트는 그 URL을 받아 `/sessions`를 만들고 `ws_url`로 붙는다.
- 직접 HTTP URL을 바로 주는 게 아니라 `cc://` 계열 deep-link를 쓸 가능성이 높다.
- 이 포맷은 parser 소스가 현재 체크아웃에 없으므로 문서에서 임의 예시를 만들면 오히려 틀릴 수 있다.

따라서 실제 사용 시에는:

1. `openpro server`를 실행해 콘솔 배너를 확인하고
2. 거기서 출력된 connect 정보나 URL을 사용하며
3. 배너가 없다면 현재 빌드에 direct connect server가 완전 포함되지 않았을 가능성을 먼저 점검하는 것이 맞다.

---

## 8. 현재 체크아웃 기준으로 확실한 것과 아닌 것

### 8.1 확실한 것

- `server` 서브커맨드 엔트리가 있다.
- `DIRECT_CONNECT` feature gate 뒤에 있다.
- `/sessions` + `ws_url` + WebSocket 구조를 사용한다.
- auth token과 `cwd` 기반으로 세션을 만든다.
- `cc://`, `cc+unix://` deep-link를 처리한다.
- client side direct connect manager는 구현되어 있다.

### 8.2 현재 체크아웃만으로는 확실하지 않은 것

- 실제 서버 라우터 구현 전체
- 서버 배너 출력 형식
- `cc://` URL 최종 포맷
- lockfile 저장 경로와 중복 서버 감지 상세 동작
- 서버가 어떤 프로세스 lifecycle 정책으로 child 세션을 완전히 관리하는지

즉, “서버 모드가 소스상 존재한다”는 건 확실하지만, “이 체크아웃만으로 서버 내부 모든 세부 동작까지 검증됐다”고 보기는 어렵다.

---

## 9. 보안 관점에서 꼭 알아야 할 점

이 기능을 운영 관점에서 볼 때 가장 중요한 점은 다음이다.

### 9.1 기본 바인딩 주소가 공격면을 넓힌다

기본값이 `0.0.0.0`이므로 아무 생각 없이 실행하면 외부 네트워크 인터페이스에 열릴 수 있다.

권장:

```bash
openpro server --host 127.0.0.1
```

### 9.2 토큰 없는 공개 노출은 피해야 한다

소스상 auth token을 지원하고, 기본값으로 랜덤 토큰도 만든다. 서버를 다른 장비나 팀과 공유하려면 적어도 다음 셋 중 하나는 필요하다.

- loopback 한정
- 방화벽 제한
- 강한 bearer token

### 9.3 `DangerousBackend`라는 이름이 말해주는 것

서버 생성 코드에서 backend는 `DangerousBackend`로 생성된다. 이름만으로 모든 동작을 확정할 수는 없지만, 최소한 이 경로는 “인터넷에 바로 노출하는 hardened multi-tenant API server”보다는 “신뢰된 운영자가 직접 띄우는 강한 권한의 세션 서버”로 이해하는 것이 안전하다.

관련 근거:

- [main.tsx](D:/project/openpro/src/main.tsx:3964)

---

## 10. 실제 운영용 권장 실행 패턴

### 10.1 개인 로컬 개발용

```bash
openpro server --host 127.0.0.1 --port 8080
```

추천 이유:

- 외부 노출 없음
- 포트 고정
- 로컬 connect/debug 용이

### 10.2 팀 내부 점프 호스트나 사내 서버용

```bash
openpro server --host 127.0.0.1 --port 8080 --auth-token "long-random-token" --max-sessions 8
```

그리고 그 앞단에 다음 중 하나를 둔다.

- SSH 터널
- reverse proxy + 사내 인증
- 방화벽 allowlist

### 10.3 외부 공개 서버 형태

현재 소스 기준으로는 권장하지 않는다.

이유:

- direct connect 기능이 feature gate 뒤에 있음
- 서버 구현 파일 일부가 현재 체크아웃에 없음
- backend가 권한 높은 세션 서버 성격으로 보임
- hardened public multi-user service용 문서나 정책이 소스에서 명확히 확인되지 않음

---

## 11. 장애 상황 체크리스트

| 증상 | 먼저 볼 것 |
|---|---|
| `openpro server` 명령이 없음 | 현재 빌드에 `DIRECT_CONNECT`가 포함됐는지 확인 |
| 서버 실행 직후 종료 | `probeRunningServer()`가 기존 서버를 감지했는지, lockfile/기존 프로세스 상태 확인 |
| connect URL이 안 붙음 | 서버 배너 출력, `cc://` 포맷, 현재 빌드의 parser 포함 여부 확인 |
| 세션 생성 실패 | `/sessions` 응답 코드, auth token, `cwd` 전달값 확인 |
| 붙자마자 WS 오류 | `ws_url`, Authorization 헤더, 프록시/방화벽 문제 확인 |
| permission prompt가 멈춤 | WS에서 `control_request`와 `control_response`가 오가는지 확인 |
| 원격 웹에서 이어서 쓰고 싶음 | `server`가 아니라 `remote-control`을 사용해야 하는지 재판단 |

---

## 12. 추천 읽기 순서

서버 모드를 더 파고들 때는 아래 순서가 이해가 빠르다.

1. [main.tsx](D:/project/openpro/src/main.tsx:3944)
2. [createDirectConnectSession.ts](D:/project/openpro/src/server/createDirectConnectSession.ts)
3. [types.ts](D:/project/openpro/src/server/types.ts)
4. [directConnectManager.ts](D:/project/openpro/src/server/directConnectManager.ts)
5. [bridgeMain.ts](D:/project/openpro/src/bridge/bridgeMain.ts:1908)

---

## 13. 한 줄 정리

OpenPro는 소스상 direct connect용 `server` 모드를 가지고 있고 `openpro server`로 기동하는 설계가 맞다. 다만 이 기능은 `DIRECT_CONNECT` feature gate 뒤에 있고, 현재 체크아웃에는 서버 내부 구현 파일 일부가 빠져 있어 “존재와 연결 프로토콜은 확인 가능하지만 배너/라우터 세부 구현은 이 스냅샷만으로 완전 검증 불가” 상태라고 보는 것이 가장 정확하다.
