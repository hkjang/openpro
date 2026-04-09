# `src/moreright` 폴더 문서

## 역할

`src/moreright`는 외부 빌드용 stub 경계입니다.  
현재 저장소에서 이 폴더는 internal-only 기능을 외부 배포판에서 no-op으로 대체하기 위한 placeholder 역할을 합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `useMoreRight.tsx` | external build용 no-op hook |

## 코드 레벨 특징

- 실제 기능 구현이 아니라 “존재해야 하는 인터페이스를 비활성 상태로 유지”하는 목적입니다.
- import 경계를 깨지 않으면서 external build에서 제외 문자열과 내부 모듈을 숨기는 데 유용합니다.

## 변경 시 체크포인트

- 이 폴더를 수정할 때는 기능 추가보다 빌드 경계와 타입 호환성을 우선 확인해야 합니다.
