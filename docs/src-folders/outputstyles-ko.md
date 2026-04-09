# `src/outputStyles` 폴더 문서

## 역할

`src/outputStyles`는 사용자 정의 출력 스타일 로더 계층입니다.  
프로젝트와 사용자 홈 디렉터리의 markdown 파일을 읽어 output style prompt로 변환합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `loadOutputStylesDir.ts` | output style markdown 로딩과 frontmatter 해석 |

## 코드 레벨 특징

- `.claude/output-styles/*.md`와 `~/.claude/output-styles/*.md`를 모두 읽습니다.
- frontmatter의 `name`, `description`, `keep-coding-instructions`를 해석합니다.
- plugin output style cache와도 연결됩니다.

## 주요 연결 지점

- `src/commands/output-style/*`
- `src/utils/plugins/loadPluginOutputStyles.ts`

## 변경 시 체크포인트

- 사용자 정의 markdown 형식은 backward compatibility가 중요합니다.
- 스타일 이름 충돌 시 프로젝트 스타일과 사용자 스타일 우선순위를 함께 검토해야 합니다.
