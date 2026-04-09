# `src/vim` 폴더 문서

## 역할

`src/vim`은 vim-style 편집 동작을 담당하는 폴더입니다.  
motion, operator, text object, state transition을 분리해 prompt input 편집 경험을 제공합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `motions.ts` | 이동 규칙 |
| `operators.ts` | 삭제/변경 등 operator |
| `textObjects.ts` | text object 처리 |
| `transitions.ts` | 상태 전이 |
| `types.ts` | vim 관련 타입 |

## 주요 연결 지점

- `src/keybindings/*`
- `src/components/PromptInput/*`

## 변경 시 체크포인트

- keybinding resolver와 motion parser가 엇갈리면 입력 버그가 생깁니다.
- 일반 단축키 모드와 vim 모드가 같은 키를 다르게 해석할 수 있음을 고려해야 합니다.
