# `src/bootstrap` 폴더 문서

## 역할

`src/bootstrap`은 프로세스 전역 상태의 기준점입니다.  
세션 ID, cwd, project root, SDK betas, main thread agent type, post-compaction flag, invoked skill, API 메트릭 등 서로 다른 계층이 공유해야 하는 값을 이 폴더가 보관합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `state.ts` | 전역 singleton state와 getter/setter 집합 |

## 코드 레벨 구조

`state.ts`는 단순 config 저장소가 아니라 아래 종류의 상태를 함께 갖습니다.

- 세션 정체성: `sessionId`, `cwd`, `originalCwd`, `projectRoot`
- 실행 모드: interactive 여부, remote 여부, assistant/kairos 여부
- 추적 데이터: API duration, tool duration, last request messages
- compact 관련 상태: `pendingPostCompaction`
- skill 관련 상태: `invokedSkills`
- 세션 메타데이터: main thread agent type, teleported session info

## 주요 연결 지점

- `src/main.tsx`
- `src/entrypoints/init.ts`
- `src/query.ts`
- `src/utils/sessionStorage.ts`
- `src/services/compact/*`
- `src/skills/*`

## 읽는 순서

1. `state.ts`의 state shape
2. getter/setter 함수
3. compact/skill/session 관련 헬퍼

## 변경 시 체크포인트

- 이 파일은 순환 의존성의 중심이라, 새로운 import 추가가 dep cycle을 만들기 쉽습니다.
- “파일 경로 기준 상태”와 “프로젝트 정체성 기준 상태”를 섞지 않아야 합니다.
- session resume, compact, subagent, task 복원은 이 파일의 상태를 광범위하게 참조합니다.
