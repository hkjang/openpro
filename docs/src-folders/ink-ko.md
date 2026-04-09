# `src/ink` 폴더 문서

## 역할

`src/ink`는 터미널 렌더링 엔진 포크 계층입니다.  
일반 비즈니스 로직 폴더가 아니라, layout, reconciler, keypress parsing, output flush 같은 저수준 UI 인프라를 제공합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `ink.tsx` | 렌더 엔진 중심 |
| `reconciler.ts` | React reconciliation 계층 |
| `output.ts` | 터미널 출력 |
| `parse-keypress.ts` | 키 입력 해석 |
| `measure-element.ts`, `measure-text.ts` | 레이아웃 측정 |

## 코드 레벨 특징

- 외부 라이브러리 포크 성격이 강합니다.
- `components`와 `screens`는 이 폴더를 직접 사용하지만, 직접 수정할 일은 상대적으로 적습니다.
- 줄바꿈, 포커스, 폭 계산, 화면 지우기, ANSI 출력 같은 문제가 여기서 해결됩니다.

## 주요 연결 지점

- `src/components/*`
- `src/screens/*`
- `src/interactiveHelpers.tsx`

## 변경 시 체크포인트

- 작은 수정이 전체 REPL 출력에 영향을 줄 수 있습니다.
- 플랫폼별 터미널 차이를 고려해야 합니다.
