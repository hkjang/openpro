# `src/native-ts` 폴더 문서

## 역할

`src/native-ts`는 네이티브 또는 고성능 보조 모듈의 소스 루트입니다.  
터미널 UI, diff, 파일 인덱싱처럼 성능 민감한 영역을 보조하는 구현이 여기에 위치합니다.

## 하위 구조

| 하위 폴더 | 역할 |
|---|---|
| `color-diff` | 컬러 diff 관련 네이티브/고성능 처리 |
| `file-index` | 파일 인덱싱 |
| `yoga-layout` | layout 엔진 관련 코드 |

## 주요 연결 지점

- `src/components/*`
- diff 렌더링 계층
- 검색/인덱싱 계층

## 변경 시 체크포인트

- 플랫폼별 빌드와 런타임 호환성을 같이 확인해야 합니다.
- 일반 TypeScript 수정과 달리 native dependency 체인 영향을 받을 수 있습니다.
