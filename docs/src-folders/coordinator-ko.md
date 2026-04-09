# `src/coordinator` 폴더 문서

## 역할

`src/coordinator`는 coordinator mode의 정책 계층입니다.  
worker에게 어떤 도구를 열어줄지, scratchpad를 어떻게 설명할지, 재개된 세션이 coordinator mode인지 일반 mode인지 어떻게 맞출지를 담당합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `coordinatorMode.ts` | coordinator mode 판정, user context, system prompt |

## 코드 레벨 특징

- feature gate와 환경변수에 크게 의존합니다.
- `QueryEngine.ts`에서 coordinator 전용 user context를 주입할 때 이 파일을 호출합니다.
- mode mismatch가 있는 세션을 재개할 때 env var를 뒤집어 상태를 보정합니다.

## 주요 연결 지점

- `src/QueryEngine.ts`
- `src/tools/AgentTool/*`
- `src/bootstrap/state.ts`

## 변경 시 체크포인트

- coordinator mode는 일반 agent flow와 다른 규칙을 가지므로 prompt만 수정하고 끝나지 않습니다.
- worker 도구 집합을 바꾸면 permission flow와 scratchpad 설명도 같이 검토해야 합니다.
