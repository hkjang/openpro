# `src/query` 폴더 문서

## 역할

`src/query`는 `src/query.ts` 본체를 보조하는 설정/의존성 분리 폴더입니다.  
query loop의 부가 정책을 작은 모듈로 나눠 유지보수하기 쉽게 만듭니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `config.ts` | query 관련 구성 값 |
| `deps.ts` | 의존성 주입 포인트 |
| `stopHooks.ts` | stop hook 처리 |
| `tokenBudget.ts` | token/task budget 계산 |

## 주요 연결 지점

- `src/query.ts`
- `src/QueryEngine.ts`

## 변경 시 체크포인트

- 본체인 `query.ts`와 계약이 맞아야 의미가 있습니다.
- token budget과 stop hook은 compact/retry path와 엮이므로 단독 수정이 위험할 수 있습니다.
