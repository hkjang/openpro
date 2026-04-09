# OpenPro 세션 저장소 및 Transcript 가이드

## 1. 문서 목적

이 문서는 OpenPro가 세션 상태를 디스크에 어떻게 저장하고, `/resume` 시 어떤 방식으로 다시 복원하는지 코드 기준으로 정리한 저장소 설계 문서다.  
대화 이력 transcript, subagent sidechain, session memory, content replacement, compact boundary, worktree 상태, context collapse 메타데이터가 어떤 파일과 구조로 남는지 실제 구현 흐름에 맞춰 설명한다.

이 문서는 다음 독자를 대상으로 한다.

- resume, compact, 세션 복원 관련 코드를 수정하는 개발자
- 대화 저장 포맷과 복원 품질을 검증해야 하는 QA
- 세션 파일 구조와 장애 분석 포인트를 이해해야 하는 플랫폼 엔지니어와 운영자

관련 문서:

- [Request Lifecycle 시퀀스 가이드](D:/project/openpro/docs/openpro-request-lifecycle-guide-ko.md)
- [메모리 / 컨텍스트 압축 상세 설계](D:/project/openpro/docs/openpro-memory-context-compaction-ko.md)
- [오류 메시지 카탈로그](D:/project/openpro/docs/openpro-error-catalog-ko.md)

---

## 2. 먼저 이해할 핵심 8가지

1. OpenPro의 대화 저장 포맷은 기본적으로 JSONL transcript 다.
2. 모든 줄이 “대화 메시지”는 아니며, title, tag, worktree, attribution, content replacement, context collapse 같은 메타 엔트리도 함께 저장된다.
3. 세션 메인 transcript 와 subagent transcript 는 파일이 분리된다.
4. session memory 는 transcript 내부가 아니라 별도 `summary.md` 파일로 저장된다.
5. `recordTranscript()` 는 무조건 append 만 하는 것이 아니라, 이미 기록된 UUID 를 dedupe 하면서 parent chain 을 보존한다.
6. `loadTranscriptFile()` 는 큰 파일을 그대로 전부 읽지 않고, compact boundary 와 metadata-only scan 을 이용해 pre-compact 구간을 건너뛸 수 있다.
7. resume 품질을 위해 content replacement, worktree state, context collapse commit, agent metadata 같은 보조 아티팩트가 별도로 유지된다.
8. “화면에 보이던 이력”과 “디스크에서 복원되는 체인”은 compact, rewind, sidechain, orphaned tool result 처리 때문에 완전히 같은 개념이 아니다.

---

## 3. 핵심 소스 파일

| 파일 | 역할 | 볼 때 집중할 포인트 |
|---|---|---|
| `src/utils/sessionStorage.ts` | transcript 저장과 로드의 중심 | write/read, resume, dedupe, compact relink |
| `src/utils/sessionStoragePortable.ts` | 큰 transcript 읽기 최적화 | precompact skip, chunked read |
| `src/types/logs.ts` | JSONL 엔트리 타입 정의 | transcript 메시지와 메타 엔트리 목록 |
| `src/utils/messages.ts` | compact boundary 탐지, resume 보정 | boundary marker, orphan tool_result 처리 |
| `src/utils/permissions/filesystem.ts` | session memory 경로 및 권한 carve-out | `session-memory/summary.md` 경로 규칙 |
| `src/services/SessionMemory/*` | session memory 요약 추출 | summary 파일 생성과 업데이트 전략 |
| `src/commands/resume/resume.tsx` | `/resume` 진입 | 세션 선택과 cross-project resume 처리 |

---

## 4. 파일 구조

## 4.1 메인 세션 파일

메인 transcript 경로는 `src/utils/sessionStorage.ts` 의 `getTranscriptPath()` 가 결정한다.

형식:

- `{projectDir}/{sessionId}.jsonl`

여기서 `projectDir` 은 기본적으로 현재 프로젝트 디렉터리이지만, resume 나 branch/worktree 전환 이후에는 `sessionProjectDir` 이 우선될 수 있다.

## 4.2 subagent transcript 파일

subagent 는 메인 세션 transcript 와 분리된 sidechain JSONL 파일을 가진다.

형식:

- `{projectDir}/{sessionId}/subagents/agent-{agentId}.jsonl`
- 하위 subdir 를 쓰는 경우: `{projectDir}/{sessionId}/subagents/<subdir>/agent-{agentId}.jsonl`

관련 함수:

- `setAgentTranscriptSubdir()`
- `getAgentTranscriptPath()`
- `clearAgentTranscriptSubdir()`

## 4.3 subagent metadata 파일

subagent 복원에는 transcript 만으로 부족한 정보가 있다.  
그래서 별도 메타 파일이 붙는다.

형식:

- `{...}/agent-{agentId}.meta.json`

대표 필드:

- `agentType`
- `worktreePath`
- `description`

## 4.4 session memory 파일

session memory 는 JSONL transcript 와 별도 디렉터리에 저장된다.

형식:

- 디렉터리: `{projectDir}/{sessionId}/session-memory/`
- 파일: `{projectDir}/{sessionId}/session-memory/summary.md`

관련 함수:

- `getSessionMemoryDir()`
- `getSessionMemoryPath()`

## 4.5 저장 구조 요약 표

| 저장 대상 | 경로 형식 | 저장 포맷 | 주요 용도 |
|---|---|---|---|
| 메인 세션 transcript | `{projectDir}/{sessionId}.jsonl` | JSONL | 메인 대화 이력, 메타데이터, resume |
| subagent transcript | `{projectDir}/{sessionId}/subagents/.../agent-{agentId}.jsonl` | JSONL | AgentTool sidechain 복원 |
| subagent metadata | same path + `.meta.json` | JSON | agent type, description, worktree 복원 |
| session memory | `{projectDir}/{sessionId}/session-memory/summary.md` | Markdown | 현재 세션 요약 |

---

## 5. transcript 엔트리 구조

`src/types/logs.ts` 의 `Entry` 는 실제 JSONL 라인 타입의 합집합이다.

크게 두 부류로 나뉜다.

### 5.1 transcript 메시지

`isTranscriptMessage()` 기준 transcript 메시지는 아래 네 종류다.

- `user`
- `assistant`
- `attachment`
- `system`

이들은 공통적으로 아래 성격을 가진다.

- `uuid`
- `parentUuid`
- `sessionId`
- `timestamp`
- `cwd`
- `version`
- `isSidechain`

즉, 대화 체인 복원에 직접 참여하는 레코드다.

### 5.2 메타 엔트리

대표 메타 엔트리:

- `summary`
- `custom-title`
- `ai-title`
- `last-prompt`
- `task-summary`
- `tag`
- `agent-name`
- `agent-color`
- `agent-setting`
- `pr-link`
- `mode`
- `worktree-state`
- `content-replacement`
- `file-history-snapshot`
- `attribution-snapshot`
- `marble-origami-commit`
- `marble-origami-snapshot`

이 엔트리들은 대화 body 자체가 아니라 “세션을 어떻게 다시 해석하고 복원할지”에 필요한 보조 정보다.

---

## 6. 쓰기 경로

## 6.1 `recordTranscript()` 의 역할

메인 transcript 쓰기 핵심은 `recordTranscript()` 다.

이 함수가 하는 일:

1. `cleanMessagesForLogging()` 으로 저장 가능한 형태로 정리
2. 현재 세션의 이미 기록된 UUID 집합을 읽음
3. 이미 저장된 메시지는 건너뜀
4. 새 메시지만 `insertMessageChain()` 으로 append
5. 마지막 실제 chain participant UUID 를 반환

중요 포인트:

- dedupe 는 단순 중복 제거가 아니라 parent chain 보존과 연결되어 있다.
- compaction 이후 `messagesToKeep` 가 뒤에 붙는 경우, compact boundary 가 잘못 부모를 이어받지 않도록 “prefix 로 나타나는 recorded 메시지만 parent 로 추적”한다.

## 6.2 sidechain 저장

subagent 결과는 `recordSidechainTranscript()` 경로로 저장된다.

차이점:

- `isSidechain=true`
- `agentId` 기준 별도 파일에 기록
- main session dedupe 집합과 sidechain 파일 dedupe 의 의미가 다름

## 6.3 content replacement 저장

큰 tool result 가 잘렸을 때는 `recordContentReplacement()` 가 별도 엔트리를 남긴다.

역할:

- in-context 에서는 축약된 stub 만 남더라도
- resume 시 “원래 어떤 block 이 치환되었는가”를 다시 적용할 수 있게 함

main thread 와 subagent 의 차이:

- main thread 는 sessionId 기준
- subagent 는 agentId 기준 맵으로 나뉜다

## 6.4 기타 메타데이터 저장

세션 저장은 메시지 외에도 아래를 계속 append 할 수 있다.

- file history snapshot
- attribution snapshot
- queue operation
- context collapse commit
- worktree state

즉, transcript 는 단순 채팅 로그가 아니라 세션 상태 로그에 가깝다.

---

## 7. 읽기 경로

## 7.1 `loadTranscriptFile()` 의 반환 구조

`loadTranscriptFile()` 는 단순히 메시지 배열만 반환하지 않는다.

대표 반환값:

- `messages`
- `summaries`
- `customTitles`
- `tags`
- `agentNames`
- `agentColors`
- `agentSettings`
- `prNumbers`, `prUrls`, `prRepositories`
- `modes`
- `worktreeStates`
- `fileHistorySnapshots`
- `attributionSnapshots`
- `contentReplacements`
- `agentContentReplacements`
- `contextCollapseCommits`
- `contextCollapseSnapshot`
- `leafUuids`

즉, resume 는 transcript 한 파일을 읽고도 세션 뷰를 재조립할 수 있게 설계되어 있다.

## 7.2 큰 파일 최적화

대형 transcript 에서는 전체 파일을 통째로 materialize 하지 않도록 여러 최적화가 들어가 있다.

대표 최적화:

- chunked read
- compact boundary 이후만 유지
- pre-boundary metadata-only scan
- dead fork branch 를 parse 이전에 걸러내는 pre-filter

핵심 배경:

- 세션 JSONL 은 수십 MB 를 넘어 수 GB 까지도 커질 수 있다.
- parse 비용보다 “이미 compact 된 죽은 branch” 를 버리는 비용이 더 커질 수 있다.

## 7.3 pre-boundary metadata 복구

compact boundary 이전 메시지는 잘라내더라도, 세션 전역 메타데이터는 여전히 필요하다.

그래서 아래 항목은 cheap scan 으로 따로 복구한다.

- `summary`
- `custom-title`
- `tag`
- `agent-name`
- `agent-color`
- `agent-setting`
- `mode`
- `worktree-state`
- `pr-link`

즉, 메시지 본문은 잘라도 세션 설명 정보는 살아남는다.

## 7.4 legacy progress bridge

과거 transcript 에는 `progress` 엔트리가 parent chain 사이에 섞여 있을 수 있다.

현재는 progress 가 transcript message 가 아니므로, 로드 시 다음 보정을 한다.

- `progress_uuid -> progress_parent_uuid` 브리지 맵 생성
- 나중 메시지가 progress 를 부모로 삼고 있으면 실제 non-progress 조상으로 parent 를 재연결

이 보정이 없으면 resume 시 체인이 중간에서 끊어진다.

---

## 8. compact 와 resume 복원

## 8.1 compact boundary 의 의미

compact 이후 transcript 에는 boundary marker 와 요약 메시지가 남는다.  
resume 시 `getMessagesAfterCompactBoundary()` 와 로드 경로가 함께 작동하여 pre-compact 대화 전체를 다시 API에 보내지 않게 만든다.

## 8.2 preserved segment

일부 compact 는 pre-boundary 메시지 중 일부를 물리적으로 보존한다.  
이 경우 boundary 만 보고 단순 절단하면 체인이 깨질 수 있어, preserved segment relink 로직이 별도로 들어간다.

핵심 역할:

- preserved 구간의 stale parent link 를 정리
- live chain 과 이어지는 leaf 를 남김
- pre-compact 유령 branch 로 인한 immediate PTL prompt-too-long 재발을 막음

## 8.3 content replacement replay

resume 시 content replacement 기록도 함께 읽는다.

이유:

- 큰 tool result 는 저장 당시 이미 축약됐을 수 있음
- resume 된 세션도 같은 축약 상태를 일관되게 유지해야 prompt cache 와 UI 가 어긋나지 않음

## 8.4 context collapse commit 복원

context collapse 는 summary placeholder 자체를 transcript 메시지로 남기지 않는 경우가 있어서, 대신 commit entry 와 snapshot entry 를 별도 저장한다.

resume 시:

- commit 배열을 순서대로 수집
- snapshot 은 last-wins 로 복원
- 이후 collapse store 가 다시 projection view 를 재구성

---

## 9. `/resume` 와 세션 선택

`/resume` 는 단순 파일 열기가 아니라 여러 후보 세션을 스캔하고, 최신 수정 시각과 메타데이터를 바탕으로 사용자에게 보여줄 세션을 고른다.

관련 포인트:

- 같은 프로젝트 / 다른 디렉터리 resume 를 구분
- cross-project resume 는 명령 복사 안내를 낼 수 있음
- sidechain 과 특정 agent 세션은 resume picker 에서 필터될 수 있음
- session file 이 비대하면 lite log 경로를 사용해 무거운 본문 로드를 늦출 수 있음

---

## 10. worktree 와 transcript

worktree 사용 세션은 `worktree-state` 엔트리로 상태를 남긴다.

의미:

- 원래 cwd
- worktree 경로
- worktree branch
- sessionId
- tmux 세션 이름

resume 시에는 이 정보로 “이 세션이 worktree 안에서 실행 중이었는지”를 복원할 수 있다.  
단, worktree 경로가 실제로 사라졌다면 복원하지 않는다.

---

## 11. 운영자가 자주 놓치는 포인트

1. transcript 파일 하나만 보면 전부 복원될 것 같지만, 실제로는 agent metadata 와 session memory 파일도 함께 봐야 할 때가 많다.
2. JSONL 안의 모든 줄이 사용자/assistant 대화는 아니다.
3. compact 이후 저장은 “예전 대화를 삭제”하는 것이 아니라, boundary 와 메타데이터를 남긴 채 읽기 전략을 바꾸는 쪽에 가깝다.
4. progress 는 최신 코드 기준 transcript 체인 참가자가 아니므로, 옛 세션을 읽을 때 bridge 보정이 필요하다.
5. content replacement 기록이 없다면 resume 시 tool result 문맥이 달라질 수 있다.
6. sidechain transcript 는 메인 session file 과 dedupe 규칙이 다르다.

---

## 12. QA 테스트 포인트

### 12.1 저장

- 새 메시지가 append 되되 중복 UUID 는 다시 기록되지 않는지
- compact 직후 boundary 와 summary 가 올바르게 저장되는지
- subagent 실행 시 별도 agent transcript 와 metadata 파일이 생기는지

### 12.2 로드

- 큰 transcript 에서 precompact skip 이 적용되어도 결과 체인이 동일한지
- custom title, tag, mode, worktree-state 가 boundary 이전에 있어도 복원되는지
- legacy progress 가 있는 옛 transcript 도 parent chain 이 이어지는지

### 12.3 resume

- content replacement 가 replay 되는지
- preserved segment 가 있는 compact transcript 가 즉시 PTL 에 빠지지 않는지
- worktree resume 가 실제 경로 존재 여부에 따라 다르게 동작하는지

---

## 13. 문서 유지보수 기준

다음이 바뀌면 이 문서를 갱신해야 한다.

- transcript 경로 규칙
- Entry 타입 목록
- `recordTranscript()` dedupe / parent chain 규칙
- `loadTranscriptFile()` 의 precompact skip 로직
- preserved segment / context collapse 복원 방식
- subagent metadata 와 worktree state 저장 방식

함께 갱신하면 좋은 문서:

- [Request Lifecycle 시퀀스 가이드](D:/project/openpro/docs/openpro-request-lifecycle-guide-ko.md)
- [메모리 / 컨텍스트 압축 상세 설계](D:/project/openpro/docs/openpro-memory-context-compaction-ko.md)
- [오류 메시지 카탈로그](D:/project/openpro/docs/openpro-error-catalog-ko.md)
