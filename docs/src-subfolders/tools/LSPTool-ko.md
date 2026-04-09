# `src/tools/LSPTool` 하위 폴더 문서

## 역할

src/tools/LSPTool는 tool 구현 모듈입니다. 모델이 직접 호출하는 기능 단위를 이 폴더가 감싸며, 보통 실행 본체, prompt 정의, UI, 상수, 타입이 함께 위치합니다.

## 기본 정보

- 소스 경로: `src/tools/LSPTool`
- 직접 파일 수: 6
- 직속 하위 폴더 수: 0
- 재귀 기준 총 파일 수: 6

## 대표 파일

| 파일 | 관찰 포인트 |
|---|---|
| `prompt.ts` | 프롬프트/도구 설명 정의 |
| `UI.tsx` | UI 또는 interactive 렌더링 보조 |
| `LSPTool.ts` | 실행 본체 또는 tool 계약 구현 파일 |
| `formatters.ts` | 핵심 구현 또는 보조 모듈 |
| `schemas.ts` | 핵심 구현 또는 보조 모듈 |
| `symbolContext.ts` | 핵심 구현 또는 보조 모듈 |

## 직접 파일 목록

- `formatters.ts`
- `LSPTool.ts`
- `prompt.ts`
- `schemas.ts`
- `symbolContext.ts`
- `UI.tsx`

## 코드 레벨 특징

- tool 폴더는 보통 본체 파일, prompt 정의, UI, 상수, 타입으로 구성됩니다.
- 상위 계층은 `src/tools.ts`에서 이 tool을 등록하고 `src/query.ts`가 실제 호출을 orchestration합니다.
- permission, file access, output size, result formatting이 함께 맞아야 실제 런타임에서 안정적으로 동작합니다.

## 주요 연결 지점

- `src/tools.ts`
- `src/Tool.ts`
- `src/query.ts`
- `src/utils/permissions/*`

## 코드 탐색 시작 순서

1. `LSPTool.ts`
2. `prompt.ts`
3. `UI.tsx`

## 변경 시 체크포인트

- tool 스키마, prompt, UI, permission 경로가 서로 일치해야 합니다.
- 결과 크기가 큰 tool라면 tool result persistence나 compact 영향도 같이 검토해야 합니다.
- `src/tools.ts` 등록 누락이 없는지 확인해야 합니다.
