# `src/schemas` 폴더 문서

## 역할

`src/schemas`는 검증 스키마를 담는 작은 공용 계층입니다.  
규모는 작지만, 런타임 데이터의 shape를 고정하는 역할을 합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `hooks.ts` | hook 관련 schema |

## 주요 연결 지점

- `src/hooks/*`
- `src/types/*`
- `src/utils/settings/*`

## 변경 시 체크포인트

- 작은 폴더지만 schema 변경은 런타임 validation 실패로 바로 이어질 수 있습니다.
