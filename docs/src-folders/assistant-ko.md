# `src/assistant` 폴더 문서

## 역할

`src/assistant`는 assistant mode와 KAIROS 계열 세션 흐름에서 사용하는 보조 계층입니다.  
현재 구조상 이 폴더는 “장기 assistant 세션의 과거 이력 조회”와 “사용자가 assistant 세션을 선택하는 UI”에 집중되어 있습니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `AssistantSessionChooser.tsx` | assistant 세션 선택 UI |
| `sessionHistory.ts` | 세션 이벤트 이력 페이징 조회, OAuth 헤더 준비 |

## 코드 레벨 구조

- `sessionHistory.ts`는 세션 이벤트 API를 직접 호출합니다.
- `createHistoryAuthCtx()`가 base URL과 인증 헤더를 한 번 준비하고, 이후 `fetchLatestEvents()`, `fetchOlderEvents()`가 페이지 단위로 이력을 가져옵니다.
- 이벤트 응답 타입은 `SDKMessage[]` 기반이므로, assistant 세션 이력도 SDK/structured message 체계를 재사용합니다.

## 주요 연결 지점

- `src/main.tsx`
- `src/commands/assistant/*`
- `src/dialogLaunchers.tsx`
- 원격 세션 API 및 OAuth 유틸

## 읽는 순서

1. `sessionHistory.ts`
2. `AssistantSessionChooser.tsx`
3. assistant 관련 command와 launch path

## 변경 시 체크포인트

- API endpoint나 beta header가 바뀌면 `sessionHistory.ts`를 먼저 수정해야 합니다.
- 페이지네이션은 `before_id` 커서 기반이므로 정렬 방향을 바꾸면 chooser 로직도 함께 확인해야 합니다.
- assistant mode는 일반 REPL과 다른 세션 UX를 가지므로, `screens/REPL.tsx` 변경만으로 맞춰지지 않습니다.
