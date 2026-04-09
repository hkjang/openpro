# `src/types` 폴더 문서

## 역할

`src/types`는 공유 타입 계층입니다.  
command, permission, id, logs, plugin, text input 같은 공통 타입을 제공하며, 순환 의존성을 줄이는 중립 지점 역할도 합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `command.ts` | command 타입 |
| `permissions.ts` | permission 관련 타입 |
| `ids.ts` | 식별자 타입 |
| `logs.ts` | 로그 타입 |
| `plugin.ts` | plugin 타입 |

## 하위 구조

| 폴더 | 역할 |
|---|---|
| `generated` | 생성된 타입 |

## 변경 시 체크포인트

- 이 계층의 타입 변경은 전역 파급 범위가 큽니다.
- 구현 파일보다 import fan-out이 더 중요하므로 영향 분석 후 수정해야 합니다.
