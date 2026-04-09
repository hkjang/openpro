# `src/context` 폴더 문서

## 역할

`src/context`는 React context provider 집합입니다.  
화면 트리 전체에서 공유해야 하는 UI 상태 채널을 제공하며, `state`와 달리 “React 트리 안에서 소비되는 전역 상태” 성격이 강합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `notifications.tsx` | 알림 context |
| `modalContext.tsx` | 모달 상태 공유 |
| `overlayContext.tsx` | 오버레이 상태 |
| `promptOverlayContext.tsx` | 입력창 상부 오버레이 |
| `mailbox.tsx` | 메시지/인박스 계열 context |
| `voice.tsx` | voice 관련 context |

## 코드 레벨 특징

- store 기반 전역 상태와 달리 React provider/consumer 패턴을 사용합니다.
- UI 편의 상태, 모달, overlay, queued message 같은 “렌더링에 가까운 전역 상태”가 많습니다.
- hook 계층이 이 context를 감싸는 경우가 많습니다.

## 주요 연결 지점

- `src/components/*`
- `src/screens/*`
- `src/hooks/*`

## 변경 시 체크포인트

- store로 올려야 할 상태와 context로 유지할 상태를 구분해야 합니다.
- context value 변경 범위가 넓으면 불필요한 rerender를 만들 수 있습니다.
