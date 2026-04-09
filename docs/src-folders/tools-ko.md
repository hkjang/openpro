# `src/tools` 폴더 문서

## 역할

`src/tools`는 모델이 호출하는 모든 tool의 실제 구현체를 담습니다.  
파일 읽기/쓰기, 셸 실행, 검색, MCP, agent spawn, task 제어, skill 호출, web fetch/search 같은 핵심 기능이 여기에 있습니다.

하위 폴더 단위 세부 문서는 [index-ko.md](D:/project/openpro/docs/src-subfolders/tools/index-ko.md)에서 확인할 수 있습니다.

## 공통 패턴

대부분의 tool 폴더는 다음 패턴을 가집니다.

- `*Tool.ts` 또는 `*Tool.tsx`
- `prompt.ts`
- `UI.tsx`
- `constants.ts`

## 큰 분류

| 분류 | 예시 |
|---|---|
| 파일 계열 | `FileReadTool`, `FileEditTool`, `FileWriteTool`, `NotebookEditTool` |
| 셸/명령 계열 | `BashTool`, `PowerShellTool`, `REPLTool` |
| 검색 계열 | `GlobTool`, `GrepTool`, `ToolSearchTool` |
| 원격/외부 연동 | `MCPTool`, `WebFetchTool`, `WebSearchTool`, `RemoteTriggerTool` |
| 에이전트/태스크 | `AgentTool`, `SendMessageTool`, `Task*Tool`, `Team*Tool` |
| 모드 제어 | `EnterPlanModeTool`, `ExitPlanModeTool`, `EnterWorktreeTool`, `ExitWorktreeTool` |
| 생산성/보조 | `SkillTool`, `TodoWriteTool`, `ConfigTool`, `BriefTool` |

## 주요 연결 지점

- `src/tools.ts`
- `src/Tool.ts`
- `src/query.ts`
- `src/utils/permissions/*`
- `src/services/tools/*`

## 읽는 순서

1. `src/tools.ts`
2. 관심 tool 폴더의 `*Tool.ts`
3. `prompt.ts`
4. `UI.tsx`
5. 관련 permission/util 코드

## 변경 시 체크포인트

- tool는 모델 스키마, 권한, 결과 포맷 세 축을 동시에 만족해야 합니다.
- 결과가 커질 수 있는 tool는 tool result persistence나 microcompact 영향을 같이 봐야 합니다.
