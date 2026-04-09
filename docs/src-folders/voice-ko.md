# `src/voice` 폴더 문서

## 역할

`src/voice`는 voice mode 사용 가능 여부를 판정하는 작은 게이트 계층입니다.  
기능 구현 전체가 아니라, voice UI를 보여줄지와 실제로 사용할 수 있는지를 결정합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `voiceModeEnabled.ts` | voice mode gate, auth 체크, kill-switch 판정 |

## 코드 레벨 특징

- GrowthBook kill-switch를 확인합니다.
- Anthropic OAuth 토큰 보유 여부를 확인합니다.
- “UI 표시 가능 여부”와 “실제 runtime 사용 가능 여부”를 구분합니다.

## 주요 연결 지점

- `src/commands/voice/*`
- `src/context/voice.tsx`
- voice 관련 component/service

## 변경 시 체크포인트

- 단순 feature flag 문제가 아니라 인증 공급자 의존성까지 포함합니다.
- API key 기반 provider에서는 voice가 동작하지 않는 점을 명시적으로 유지해야 합니다.
