# `src/memdir` 폴더 문서

## 역할

`src/memdir`는 auto memory와 team memory의 파일 시스템 계층입니다.  
memory directory 경로 계산, `MEMORY.md` 인덱스 규칙, memory prompt 생성, memory scan, team memory prompt를 담당합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `paths.ts` | auto memory 경로 계산과 enable 판정 |
| `memdir.ts` | memory prompt 생성, entrypoint truncation, directory ensure |
| `findRelevantMemories.ts` | 관련 memory 검색 |
| `memoryScan.ts` | memory 스캔 |
| `teamMemPaths.ts` | team memory 경로 |
| `teamMemPrompts.ts` | team memory prompt |

## 코드 레벨 특징

- `MEMORY.md`는 인덱스 역할이며, 실제 memory content는 개별 파일에 저장하는 설계를 강제합니다.
- `paths.ts`는 security-sensitive 코드입니다. override path, settings path, 기본 path 처리 순서를 이 파일이 결정합니다.
- `memdir.ts`는 prompt 생성 시 memory directory를 미리 생성해 모델이 곧바로 Write 하도록 유도합니다.

## 주요 연결 지점

- `src/context.ts`
- `src/utils/claudemd.ts`
- `src/query.ts`
- `src/tools/AgentTool/agentMemory.ts`

## 변경 시 체크포인트

- 경로 판정 변경은 permissions carve-out과 함께 검토해야 합니다.
- `MEMORY.md` truncation 규칙을 바꾸면 prompt budget과 recall 품질 모두 영향을 받습니다.
