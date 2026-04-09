# `src/upstreamproxy` 폴더 문서

## 역할

`src/upstreamproxy`는 CCR container 안에서 upstream proxy를 초기화하고 relay를 띄우는 특수 폴더입니다.  
원격 세션이 조직 프록시를 통해 외부 네트워크에 접근하도록 할 때 이 계층이 동작합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `upstreamproxy.ts` | upstream proxy 초기화와 env 노출 |
| `relay.ts` | local relay |
| `upstreamproxy.test.ts` | 테스트 |

## 코드 레벨 특징

- 세션 토큰 파일 읽기
- dumpable 비활성화
- CA bundle 다운로드/구성
- relay 기동
- subprocess용 `HTTPS_PROXY`, `SSL_CERT_FILE` 노출

## 주요 연결 지점

- `src/entrypoints/init.ts`
- subprocess env 주입 계층

## 변경 시 체크포인트

- 실패해도 세션을 깨지 않는 fail-open 원칙이 중요합니다.
- CA bundle 처리와 token unlink 순서가 보안상 중요합니다.
