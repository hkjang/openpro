# `src/commands/ant-trace` 하위 폴더 문서

## 역할

src/commands/ant-trace는 slash command 하위 모듈입니다. 이 폴더는 /ant-trace 관련 명령 흐름, 보조 UI, prompt 생성, 비대화형 처리 코드를 담는 영역으로 봐야 합니다.

## 기본 정보

- 소스 경로: `src/commands/ant-trace`
- 직접 파일 수: 1
- 직속 하위 폴더 수: 0
- 재귀 기준 총 파일 수: 1

## 대표 파일

| 파일 | 관찰 포인트 |
|---|---|
| `index.js` | 핵심 구현 또는 보조 모듈 |

## 직접 파일 목록

- `index.js`

## 코드 레벨 특징

- command 하위 모듈은 보통 `index.ts`를 중심으로 로컬 명령, prompt 명령, JSX 명령 중 하나를 구현합니다.
- UI가 필요한 경우 `UI.tsx`나 관련 component/hook을 함께 둡니다.
- provider, permission, session, compact 같은 상위 공통 문맥은 `ToolUseContext`를 통해 주입됩니다.

## 주요 연결 지점

- `src/commands.ts`
- `src/screens/REPL.tsx`
- `ToolUseContext`
- 관련 `components`/`hooks`

## 코드 탐색 시작 순서

1. `index.js`

## 변경 시 체크포인트

- 명령 등록 여부를 `src/commands.ts`에서 함께 확인해야 합니다.
- interactive와 non-interactive 경로가 분리되는지 확인해야 합니다.
- help/onboarding/example command 노출 여부도 함께 점검하는 편이 좋습니다.
