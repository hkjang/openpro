# `src/utils` 폴더 문서

## 역할

`src/utils`는 OpenPro 전역에서 재사용되는 인프라 계층입니다.  
설정, 세션 저장, 메시지 변환, 권한 판정, subprocess 환경, 모델/provider 보조, plugin/skill 로딩, sandbox, telemetry, memory 보조 등 횡단 관심사가 이 폴더에 모입니다.

하위 폴더 단위 세부 문서는 [index-ko.md](D:/project/openpro/docs/src-subfolders/utils/index-ko.md)에서 확인할 수 있습니다.

## 성격

- 저장소에서 가장 넓은 fan-out을 갖는 폴더입니다.
- “순수 유틸”과 “사실상 서비스 수준 인프라”가 함께 존재합니다.
- `query.ts`, `main.tsx`, `commands`, `tools`, `services`가 모두 이 폴더를 읽습니다.

## 핵심 하위 디렉터리

| 하위 폴더 | 역할 |
|---|---|
| `permissions` | 파일/도구 권한 판정, path safety |
| `settings` | 설정 merge, cache, validation, source layering |
| `plugins` | plugin 로더, 캐시, 버전 관리, trust |
| `skills` | skill 로드/변경 감지/telemetry |
| `messages` | 메시지 변환, mapper, 시스템 메시지 보조 |
| `model` | 모델 문자열, capability, provider, deprecation |
| `task` | task 출력/저장 보조 |
| `teleport` | 원격 teleport API/복원 |
| `sandbox` | sandbox adapter |
| `secureStorage` | 자격 증명 저장 |
| `swarm` | 팀/worker/swarm 보조 |
| `hooks` | hook 실행 보조 |
| `memory` | memory 공통 유틸 |

## 자주 읽는 단일 파일

- `config.ts`
- `sessionStorage.ts`
- `claudemd.ts`
- `systemPrompt.ts`
- `toolResultStorage.ts`
- `permissions/filesystem.ts`
- `settings/settings.ts`

## 주요 연결 지점

- `src/main.tsx`
- `src/query.ts`
- `src/QueryEngine.ts`
- `src/tools/*`
- `src/services/*`

## 변경 시 체크포인트

- 이 폴더 수정은 광범위한 회귀를 부를 수 있으므로 영향 분석이 필수입니다.
- domain-specific 로직이 여기로 과도하게 쌓이지 않도록 주의해야 합니다.
- utility처럼 보여도 prompt, permission, transcript, resume를 동시에 건드리는 경우가 많습니다.
