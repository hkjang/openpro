# `src/components` 폴더 문서

## 역할

`src/components`는 REPL과 부가 화면을 구성하는 Ink/React 프리젠테이션 계층입니다.  
상태를 직접 소유하기보다는 `state`, `context`, `hooks`에서 받은 정보를 렌더링하는 역할이 중심입니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `App.tsx` | 최상위 UI 조립 |
| `CompactSummary.tsx` | compact 결과 요약 UI |
| `ContextVisualization.tsx` | 컨텍스트 시각화 |
| `BridgeDialog.tsx` | bridge 대화상자 |
| `DevBar.tsx` | 개발/진단 바 |
| `PromptInput/*` | 입력창 관련 UI |
| `messages/*` | 메시지 블록 렌더러 |

## 하위 구조

주요 하위 디렉터리:

- `agents`: agent 상태와 진행 표시
- `design-system`: 공통 UI primitive
- `diff`, `StructuredDiff`: 변경 사항 렌더
- `permissions`: 권한 프롬프트 UI
- `memory`: memory file selector, 알림 UI
- `mcp`, `skills`, `tasks`, `teams`: 도메인별 UI 조각
- `wizard`, `Settings`, `HelpV2`: 안내/설정 UI

## 런타임 연결

- `src/screens/*`가 이 폴더를 조립합니다.
- `src/hooks/*`가 이벤트와 상태 결합을 제공합니다.
- `src/context/*`가 notifications, modal, overlay 같은 공유 채널을 제공합니다.
- 일부 컴포넌트는 `Ink` 포크 계층과 긴밀하게 연결됩니다.

## 읽는 순서

1. `App.tsx`
2. `screens/REPL.tsx`
3. 관심 영역 하위 폴더

## 변경 시 체크포인트

- 렌더링 성능 문제는 `components` 자체가 아니라 `hooks`나 `state` 갱신 빈도에서 오는 경우가 많습니다.
- business logic을 여기에 넣지 말고 `services`나 `utils`, `hooks`로 분리하는 편이 좋습니다.
- terminal UI 특성상 폭 계산, 줄바꿈, focus handling은 `ink` 계층과 함께 봐야 합니다.
