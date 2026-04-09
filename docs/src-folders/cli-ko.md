# `src/cli` 폴더 문서

## 역할

`src/cli`는 REPL 밖에서 실행되는 CLI 경로를 담당합니다.  
structured IO, non-interactive 출력, transport, handler를 통해 앱 내부 이벤트를 외부 프로세스나 다른 런타임에 전달합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `structuredIO.ts` | 구조화 출력/입력 처리 |
| `remoteIO.ts` | 원격 I/O 경계 |
| `print.ts` | CLI 출력 |
| `update.ts` | 업데이트 관련 출력 흐름 |
| `handlers/*` | 명령별 핸들러 |
| `transports/*` | 전송 계층 |

## 코드 레벨 구조

핵심 하위 영역:

- `handlers`: auth, agents, auto mode, plugin, MCP 등 CLI용 처리기
- `transports`: SSE, hybrid transport, batch uploader, CCR client

이 계층은 “REPL을 렌더링하는 UI 코드”가 아니라 “CLI 이벤트를 어떤 형식으로 내보낼 것인가”에 초점을 둡니다.

## 주요 연결 지점

- `src/entrypoints/*`
- `src/remote/*`
- `src/server/*`
- `src/main.tsx`

## 읽는 순서

1. `structuredIO.ts`
2. `handlers/*`
3. `transports/*`

## 변경 시 체크포인트

- JSON/structured output 계약을 깨면 외부 소비자가 바로 영향을 받습니다.
- REPL 경로에서 보이는 메시지와 CLI 출력 메시지는 동일하지 않을 수 있으므로 둘을 함께 비교해야 합니다.
