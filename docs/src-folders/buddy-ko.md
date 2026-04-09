# `src/buddy` 폴더 문서

## 역할

`src/buddy`는 UI companion 계층입니다.  
기능 로직보다 사용자 경험을 보조하는 시각 요소, 프롬프트, 알림 동작을 담당합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `companion.ts` | buddy 동작 보조 |
| `CompanionSprite.tsx` | sprite 렌더링 |
| `prompt.ts` | buddy 관련 문구 |
| `sprites.ts` | sprite 리소스/매핑 |
| `useBuddyNotification.tsx` | buddy 알림 훅 |

## 코드 레벨 구조

- stateful interaction보다는 UI 반응과 보조 표현에 가깝습니다.
- 렌더링과 알림 훅이 분리되어 있습니다.
- command 또는 feature gate를 통해 활성화되는 UX 계층으로 보는 편이 적절합니다.

## 주요 연결 지점

- `src/components/*`
- `src/hooks/*`
- `src/commands/buddy/*`

## 변경 시 체크포인트

- 기능 로직을 이 폴더로 밀어넣기보다는 시각적/경험적 역할만 유지하는 것이 좋습니다.
- sprite 리소스와 알림 훅의 생명주기가 어긋나면 UI 깜빡임이 발생할 수 있습니다.
