# `src/tasks` 폴더 문서

## 역할

`src/tasks`는 background 또는 장기 실행 unit의 실제 구현체를 담습니다.  
`src/tasks.ts`가 레지스트리라면, 이 폴더는 task type별 실제 동작입니다.

## 대표 하위 폴더

| 폴더 | 대표 파일 | 역할 |
|---|---|---|
| `DreamTask` | `DreamTask.ts` | background memory consolidation |
| `InProcessTeammateTask` | `InProcessTeammateTask.tsx` | process 내부 teammate 실행 |
| `LocalAgentTask` | `LocalAgentTask.tsx` | 로컬 subagent 실행 |
| `LocalShellTask` | `LocalShellTask.tsx` | 로컬 shell 실행 |
| `RemoteAgentTask` | `RemoteAgentTask.tsx` | 원격 agent task |

## 주요 연결 지점

- `src/tasks.ts`
- `src/tools/Task*`
- `src/state/*`
- `src/utils/task/*`

## 변경 시 체크포인트

- task 상태 전이와 output file 관리가 핵심입니다.
- kill/cleanup 동작을 빼먹으면 orphan task가 남을 수 있습니다.
