# `src/constants` 폴더 문서

## 역할

`src/constants`는 문자열 상수 모음집이 아니라, 시스템 프롬프트와 제품 동작의 공통 기준점을 담는 폴더입니다.  
API 한도, 제품 식별자, 툴 제한, spinner 문구, system prompt section 이름 등이 여기에 정의됩니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `prompts.ts` | system prompt 주요 문구와 섹션 조합 |
| `tools.ts` | 도구 관련 상수 |
| `toolLimits.ts` | 도구 제한값 |
| `apiLimits.ts` | API 한도 |
| `product.ts` | 제품명, URL 등 제품 정체성 |
| `systemPromptSections.ts` | system prompt section key |
| `xml.ts` | XML tag 상수 |

## 주요 연결 지점

- `src/context.ts`
- `src/utils/systemPrompt.ts`
- `src/query.ts`
- `src/tools/*`
- `src/commands/*`

## 변경 시 체크포인트

- `prompts.ts`와 `systemPromptSections.ts`는 prompt cache, compact, memory 계층과 간접적으로 연결됩니다.
- 상수 변경이 실제 behavior 변경을 유발하는 경우가 많아, 단순 rename로 보면 안 됩니다.
- XML/attachment/tag 문자열은 transcript, parser, UI가 함께 참조할 수 있습니다.
