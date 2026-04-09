# `src/screens` 폴더 문서

## 역할

`src/screens`는 최상위 화면 단위를 담는 composition 계층입니다.  
실제 세부 렌더링은 `components`가 담당하지만, 화면 레벨에서 어떤 컴포넌트를 어떤 상태와 함께 묶을지 결정하는 곳은 이 폴더입니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `REPL.tsx` | 메인 대화형 화면 |
| `Doctor.tsx` | 진단 화면 |
| `ResumeConversation.tsx` | 세션 재개 화면 |

## 코드 레벨 특징

- `REPL.tsx`가 사실상 앱의 중심 화면입니다.
- commands, hooks, context, state, components를 조립합니다.
- 화면 수는 적지만 각 파일의 책임은 큽니다.

## 주요 연결 지점

- `src/components/*`
- `src/hooks/*`
- `src/state/*`
- `src/commands.ts`

## 변경 시 체크포인트

- 화면 파일은 orchestration layer이므로 비즈니스 로직을 계속 추가하면 비대해지기 쉽습니다.
- REPL 화면 수정은 키 입력, 스크롤, interrupt, task UI까지 함께 영향을 줄 수 있습니다.
