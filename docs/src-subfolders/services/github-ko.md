# `src/services/github` 하위 폴더 문서

## 역할

src/services/github는 서비스 레이어 하위 모듈입니다. 이 폴더는 특정 기능 영역의 비즈니스 로직, 외부 연동, 내부 상태 보조 로직을 구현하며 주로 query.ts, command, tool 계층에서 호출됩니다.

## 기본 정보

- 소스 경로: `src/services/github`
- 직접 파일 수: 2
- 직속 하위 폴더 수: 0
- 재귀 기준 총 파일 수: 2

## 대표 파일

| 파일 | 관찰 포인트 |
|---|---|
| `deviceFlow.test.ts` | 핵심 구현 또는 보조 모듈 |
| `deviceFlow.ts` | 핵심 구현 또는 보조 모듈 |

## 직접 파일 목록

- `deviceFlow.test.ts`
- `deviceFlow.ts`

## 코드 레벨 특징

- 이 폴더는 UI보다 실행 규칙과 외부/내부 시스템 연계를 중심으로 설계되는 경우가 많습니다.
- `index.ts`가 있으면 상위 계층에서 이 폴더를 서비스 진입점처럼 소비할 가능성이 높습니다.
- query loop, remote session, telemetry, retry, background task와 엮일 수 있으므로 호출 흐름을 함께 봐야 합니다.

## 주요 연결 지점

- `src/query.ts`
- 관련 `commands`/`tools`
- 관련 `utils`
- 일부는 `main.tsx` 초기화 경로

## 코드 탐색 시작 순서

1. `deviceFlow.test.ts`
2. `deviceFlow.ts`

## 변경 시 체크포인트

- 이 계층은 실제 비즈니스 규칙이므로 호출부와 테스트 범위를 넓게 봐야 합니다.
- 서비스 로직을 `utils`로 내릴지 여부는 재사용성보다 도메인 책임을 기준으로 판단하는 편이 안전합니다.
- query/retry/telemetry와 연결되는 경우 side effect를 함께 확인해야 합니다.
