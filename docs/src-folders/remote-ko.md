# `src/remote` 폴더 문서

## 역할

`src/remote`는 원격 세션 런타임 계층입니다.  
원격 세션 관리자, WebSocket 연결, 원격 권한 브리지, SDK 메시지 adapter가 이 폴더에 모입니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `RemoteSessionManager.ts` | 원격 세션 수명주기 관리 |
| `SessionsWebSocket.ts` | 원격 세션 WS 연결 |
| `remotePermissionBridge.ts` | 원격 권한 질의 브리지 |
| `sdkMessageAdapter.ts` | SDK 메시지 변환 |

## 코드 레벨 특징

- bridge와 server 계층 사이에서 실질적인 원격 세션 상태를 유지합니다.
- reconnect, session resume, message adaptation이 핵심 주제입니다.

## 주요 연결 지점

- `src/bridge/*`
- `src/server/*`
- `src/cli/*`
- `src/main.tsx`

## 변경 시 체크포인트

- reconnect 로직 수정 시 세션 유실 여부를 반드시 확인해야 합니다.
- SDK 메시지 adapter는 transcript/structured output과 계약을 공유합니다.
