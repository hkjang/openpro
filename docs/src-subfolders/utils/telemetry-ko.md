# `src/utils/telemetry` 하위 폴더 문서

## 역할

src/utils/telemetry는 공통 유틸리티 하위 모듈입니다. 특정 도메인 하나에 종속되기보다 여러 계층에서 재사용되는 인프라/헬퍼 로직을 제공하는 폴더입니다.

## 기본 정보

- 소스 경로: `src/utils/telemetry`
- 직접 파일 수: 9
- 직속 하위 폴더 수: 0
- 재귀 기준 총 파일 수: 9

## 대표 파일

| 파일 | 관찰 포인트 |
|---|---|
| `betaSessionTracing.ts` | 핵심 구현 또는 보조 모듈 |
| `bigqueryExporter.ts` | 핵심 구현 또는 보조 모듈 |
| `events.ts` | 핵심 구현 또는 보조 모듈 |
| `instrumentation.ts` | 핵심 구현 또는 보조 모듈 |
| `logger.ts` | 핵심 구현 또는 보조 모듈 |
| `perfettoTracing.ts` | 핵심 구현 또는 보조 모듈 |
| `pluginTelemetry.ts` | 핵심 구현 또는 보조 모듈 |
| `sessionTracing.ts` | 핵심 구현 또는 보조 모듈 |

## 직접 파일 목록

- `betaSessionTracing.ts`
- `bigqueryExporter.ts`
- `events.ts`
- `instrumentation.ts`
- `logger.ts`
- `perfettoTracing.ts`
- `pluginTelemetry.ts`
- `sessionTracing.ts`
- `skillLoadedEvent.ts`

## 코드 레벨 특징

- utility 하위 폴더는 여러 계층에서 재사용되는 helper 또는 인프라 코드를 담는 경우가 많습니다.
- 단순 helper처럼 보여도 session storage, permission, provider config처럼 강한 side effect를 갖는 경우가 있습니다.
- 호출부가 넓기 때문에 소규모 수정도 영향 범위가 커질 수 있습니다.

## 주요 연결 지점

- `src/main.tsx`
- `src/query.ts`
- `src/QueryEngine.ts`
- 다수의 `commands`/`tools`/`services`

## 코드 탐색 시작 순서

1. `betaSessionTracing.ts`
2. `bigqueryExporter.ts`
3. `events.ts`
4. `instrumentation.ts`

## 변경 시 체크포인트

- fan-out이 넓은 유틸일수록 영향 분석이 필수입니다.
- side effect를 숨긴 유틸은 resume, compact, permission 흐름에 예상치 못한 영향을 줄 수 있습니다.
- 도메인 전용 로직이 과도하게 커졌다면 services 계층으로 올릴지 검토해야 합니다.
