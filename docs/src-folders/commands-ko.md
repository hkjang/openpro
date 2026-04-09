# `src/commands` 폴더 문서

## 역할

`src/commands`는 slash command의 실제 구현 계층입니다.  
사용자가 `/compact`, `/memory`, `/resume`, `/provider`처럼 입력하는 명령이 이 폴더 아래에서 구현되고, `src/commands.ts`가 이를 레지스트리로 묶습니다.

하위 폴더 단위 세부 문서는 [index-ko.md](D:/project/openpro/docs/src-subfolders/commands/index-ko.md)에서 확인할 수 있습니다.

## 대표 파일과 구조

| 구분 | 설명 |
|---|---|
| direct file command | `commit.ts`, `review.ts`, `advisor.ts`, `version.ts`처럼 루트 파일에 직접 구현된 명령 |
| folder command | `compact/index.ts`, `memory/index.ts`처럼 하위 폴더에 모듈화된 명령 |
| feature-gated command | `voice`, `bridge`, `assistant`처럼 빌드/실험 플래그에 따라 등록되는 명령 |

대표 파일:

- `src/commands.ts`
- `src/commands/compact/*`
- `src/commands/context/*`
- `src/commands/memory/*`
- `src/commands/resume/*`
- `src/commands/provider/*`
- `src/commands/plugin/*`
- `src/commands/skills/*`

## 내부 역할 분류

이 폴더는 대체로 아래 범주로 나눌 수 있습니다.

- 세션 제어: `clear`, `resume`, `rewind`, `rename`, `tag`, `session`
- 모델/설정/인증: `provider`, `model`, `login`, `logout`, `config`, `permissions`
- 개발 도구: `diff`, `doctor`, `files`, `hooks`, `mcp`, `review`
- 작업 흐름: `compact`, `plan`, `tasks`, `issue`, `commit`
- 운영/관측: `cost`, `usage`, `stats`, `release-notes`, `upgrade`
- 옵션 기능: `voice`, `bridge`, `assistant`, `chrome`, `teleport`

## 런타임 연결

- 등록: `src/commands.ts`
- UI 진입: `src/screens/REPL.tsx`
- 공통 실행 문맥: `ToolUseContext`
- JSX 명령은 `components`와 직접 연결
- 일부 명령은 내부적으로 `query.ts` 또는 `tools/*`를 다시 호출

## 확장 방법

새 명령을 추가할 때 기본 흐름은 다음과 같습니다.

1. `src/commands/<new-command>/index.ts` 또는 루트 direct file 생성
2. `types/command.ts` 계약에 맞는 command object 작성
3. `src/commands.ts`에 등록
4. interactive/non-interactive 동작 차이 점검
5. 필요 시 UI 컴포넌트와 권한 흐름 연결

## 변경 시 체크포인트

- 명령 등록만 하고 help/onboarding/example command에 연결하지 않으면 사용자가 발견하지 못할 수 있습니다.
- 일부 명령은 prompt-generating command이고, 일부는 local command이므로 반환 타입이 다릅니다.
- lazy import 명령은 번들 크기와 startup 성능을 고려해 설계된 경우가 많습니다.
