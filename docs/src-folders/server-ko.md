# `src/server` 폴더 문서

## 역할

`src/server`는 direct connect 세션과 서버 측 세션 관리의 시작점을 담습니다.  
원격 접속을 위한 세션 생성과 관리 로직이 이 폴더에 있습니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `createDirectConnectSession.ts` | direct connect 세션 생성 |
| `directConnectManager.ts` | direct connect 세션 관리 |
| `types.ts` | server 관련 타입 |

## 주요 연결 지점

- `src/main.tsx`
- `src/remote/*`
- `src/bridge/*`
- `src/cli/*`

## 변경 시 체크포인트

- 인증/세션 수명주기 변경 시 remote와 bridge를 함께 점검해야 합니다.
