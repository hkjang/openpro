# `src/commands/install-github-app` 하위 폴더 문서

## 역할

src/commands/install-github-app는 slash command 하위 모듈입니다. 이 폴더는 /install-github-app 관련 명령 흐름, 보조 UI, prompt 생성, 비대화형 처리 코드를 담는 영역으로 봐야 합니다.

## 기본 정보

- 소스 경로: `src/commands/install-github-app`
- 직접 파일 수: 14
- 직속 하위 폴더 수: 0
- 재귀 기준 총 파일 수: 14

## 대표 파일

| 파일 | 관찰 포인트 |
|---|---|
| `index.ts` | 이 폴더의 대표 진입점 가능성이 높음 |
| `ApiKeyStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `CheckExistingSecretStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `CheckGitHubStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `ChooseRepoStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `CreatingStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `ErrorStep.tsx` | 핵심 구현 또는 보조 모듈 |
| `ExistingWorkflowStep.tsx` | 핵심 구현 또는 보조 모듈 |

## 직접 파일 목록

- `ApiKeyStep.tsx`
- `CheckExistingSecretStep.tsx`
- `CheckGitHubStep.tsx`
- `ChooseRepoStep.tsx`
- `CreatingStep.tsx`
- `ErrorStep.tsx`
- `ExistingWorkflowStep.tsx`
- `index.ts`
- `InstallAppStep.tsx`
- `install-github-app.tsx`
- `OAuthFlowStep.tsx`
- `setupGitHubActions.ts`
- `SuccessStep.tsx`
- `WarningsStep.tsx`

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

1. ``index.ts``

## 변경 시 체크포인트

- 명령 등록 여부를 `src/commands.ts`에서 함께 확인해야 합니다.
- interactive와 non-interactive 경로가 분리되는지 확인해야 합니다.
- help/onboarding/example command 노출 여부도 함께 점검하는 편이 좋습니다.
