# `src/keybindings` 폴더 문서

## 역할

`src/keybindings`는 단축키 시스템의 기준 계층입니다.  
기본 단축키 정의, 사용자 설정 로드, 스키마 검증, 파싱, 매칭, resolver를 이 폴더가 담당합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `defaultBindings.ts` | 기본 단축키 정의 |
| `schema.ts` | keybinding schema |
| `parser.ts` | 단축키 문자열 파싱 |
| `resolver.ts` | 충돌 해결과 최종 매칭 |
| `useKeybinding.ts` | 화면 연결용 hook |

## 주요 연결 지점

- `src/hooks/*`
- `src/components/PromptInput/*`
- `src/vim/*`

## 변경 시 체크포인트

- 단축키 표기 문자열과 실제 keypress parser가 일치해야 합니다.
- vim 모드와 일반 shortcut mode 간 충돌을 함께 봐야 합니다.
