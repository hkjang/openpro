# `src/state` 폴더 문서

## 역할

`src/state`는 REPL 애플리케이션 상태를 저장하는 store 계층입니다.  
UI가 직접 읽는 상태와 background task가 갱신하는 상태가 이 폴더에서 만납니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `AppStateStore.ts` | AppState 구조와 기본값 |
| `store.ts` | store 생성 |
| `selectors.ts` | selector 모음 |
| `onChangeAppState.ts` | state 변화 후 처리 |

## 주요 연결 지점

- `src/screens/*`
- `src/components/*`
- `src/tasks/*`
- `src/QueryEngine.ts`

## 변경 시 체크포인트

- 상태 shape 변경은 selector, component, task UI에 동시에 영향 줄 수 있습니다.
- “React context로 둘 상태”와 “store로 둘 상태”를 구분해야 합니다.
