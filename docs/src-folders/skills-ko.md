# `src/skills` 폴더 문서

## 역할

`src/skills`는 skill 정의를 읽고 registry로 구성하는 계층입니다.  
사용자 skill, bundled skill, plugin skill을 함께 다루는 시작점입니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `loadSkillsDir.ts` | skill 디렉터리 로더 |
| `bundledSkills.ts` | bundled skill registry |
| `mcpSkillBuilders.ts` | MCP 기반 skill 빌더 |

## 하위 구조

| 폴더 | 역할 |
|---|---|
| `bundled` | 기본 제공 skill 모음 |

## 주요 연결 지점

- `src/tools/SkillTool/*`
- `src/commands/skills/*`
- `src/main.tsx`
- `src/utils/skills/*`

## 변경 시 체크포인트

- skill 로드 순서와 override 규칙은 사용자 경험에 직접 영향을 줍니다.
- bundled skill과 plugin skill이 같은 이름을 가질 때 충돌 처리 규칙을 확인해야 합니다.
