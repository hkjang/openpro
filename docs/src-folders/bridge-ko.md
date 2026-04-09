# `src/bridge` 폴더 문서

## 역할

`src/bridge`는 bridge mode와 외부 제어 세션의 실제 메시징 계층입니다.  
원격 세션이나 데스크톱/외부 클라이언트와 REPL 사이에서 세션 생성, 상태 폴링, inbound attachment 처리, 권한 콜백, bridge UI 상태 갱신을 담당합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `bridgeMain.ts` | bridge 실행 흐름의 중심 |
| `remoteBridgeCore.ts` | 원격 bridge 코어 로직 |
| `bridgeMessaging.ts` | 메시지 송수신 규약 |
| `bridgeApi.ts` | bridge API 호출 |
| `bridgePermissionCallbacks.ts` | 권한 응답 콜백 |
| `inboundMessages.ts` | 외부에서 들어온 메시지 처리 |
| `inboundAttachments.ts` | 외부 attachment 처리 |
| `createSession.ts` | bridge 세션 생성 |

## 코드 레벨 구조

이 폴더는 크게 네 부분으로 나뉩니다.

1. 세션 생성과 상태 부트스트랩
2. 양방향 메시징
3. 권한/상태 콜백
4. UI 및 디버깅 보조

특징:

- `remote` 및 `server`와 강하게 결합됩니다.
- 단순 API 호출 계층이 아니라 세션 수명주기 조정자 역할도 합니다.
- 메시지와 attachment를 별도 파이프라인으로 처리합니다.

## 주요 연결 지점

- `src/remote/*`
- `src/server/*`
- `src/cli/*`
- `src/components/BridgeDialog.tsx`
- `src/commands/bridge/*`

## 읽는 순서

1. `bridgeMain.ts`
2. `remoteBridgeCore.ts`
3. `bridgeMessaging.ts`
4. `inboundMessages.ts`, `inboundAttachments.ts`

## 변경 시 체크포인트

- bridge는 사용자 입력, 시스템 이벤트, 권한 응답이 서로 다른 타이밍으로 도착하므로 race condition을 주의해야 합니다.
- 원격 세션 재연결과 bridge 재개는 `remote` 폴더와 함께 테스트해야 합니다.
- attachment 처리 규약이 바뀌면 `query.ts`와 메시지 mapper 쪽도 같이 검토해야 합니다.
