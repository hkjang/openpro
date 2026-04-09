# `src/migrations` 폴더 문서

## 역할

`src/migrations`는 설정과 모델 선택값의 하위 호환성을 유지하기 위한 startup migration 집합입니다.  
구버전 설정 파일을 새 버전에 맞게 자동 조정할 때 이 폴더의 스크립트가 호출됩니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `migrateAutoUpdatesToSettings.ts` | auto update 설정 이관 |
| `migrateBypassPermissionsAcceptedToSettings.ts` | 권한 수용 상태 이관 |
| `migrateSonnet45ToSonnet46.ts` | 모델명 migration |
| `resetAutoModeOptInForDefaultOffer.ts` | 기본 offer 변경 시 opt-in reset |

## 주요 연결 지점

- `src/main.tsx`
- `src/utils/config.ts`
- `src/utils/settings/*`

## 변경 시 체크포인트

- migration은 startup side effect이므로 실패가 초기 실행 전체를 깨지 않게 설계해야 합니다.
- 한번 적용된 migration은 idempotent해야 합니다.
