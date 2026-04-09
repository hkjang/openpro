# `src/hooks` 폴더 문서

## 역할

`src/hooks`는 REPL UI와 상호작용을 구성하는 custom hook 모음입니다.  
입력 처리, 취소, 권한 질의, 추천, background task 이동, IDE 연동, clipboard, dynamic config 반영 같은 기능이 이 폴더에서 분리됩니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `useCommandQueue.ts` | 명령 큐 처리 |
| `useCancelRequest.ts` | 요청 취소 |
| `useCanUseTool.tsx` | 도구 권한 질의와 승인 흐름 |
| `useDynamicConfig.ts` | 동적 설정 반영 |
| `useBackgroundTaskNavigation.ts` | background task UI 이동 |
| `useDiffInIDE.ts` | IDE diff 연동 |

## 하위 구조

| 하위 폴더 | 역할 |
|---|---|
| `notifs` | 알림 관련 보조 훅 |
| `toolPermission` | 권한 관련 보조 훅 |

## 주요 연결 지점

- `src/components/*`
- `src/screens/REPL.tsx`
- `src/state/*`
- `src/context/*`

## 변경 시 체크포인트

- hook는 렌더링 타이밍에 민감하므로 side effect 위치를 잘못 잡으면 중복 실행이 발생합니다.
- UI 버그처럼 보여도 실제 원인이 hook 내부 상태머신인 경우가 많습니다.
