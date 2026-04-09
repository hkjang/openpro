# `src/entrypoints` 폴더 문서

## 역할

`src/entrypoints`는 OpenPro를 외부에서 시작하는 진입점을 모은 폴더입니다.  
CLI, MCP, SDK가 각각 어디서 초기화되고 어떤 타입 계약을 사용하는지를 이 폴더에서 확인할 수 있습니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `init.ts` | 안전한 초기화 루틴 |
| `cli.tsx` | CLI 엔트리 |
| `mcp.ts` | MCP 엔트리 |
| `agentSdkTypes.ts` | SDK 메시지 타입 |
| `sdk/*` | SDK schema와 runtime 타입 |

## 코드 레벨 특징

- 외부 소비자와 맞닿는 계약 계층입니다.
- `main.tsx`와 연결되는 초기화 코드가 일부 있고, SDK/CLI 전용 타입이 별도로 존재합니다.
- structured message, permission denial, compact boundary 같은 개념이 SDK 타입에도 반영됩니다.

## 주요 연결 지점

- `src/main.tsx`
- `src/QueryEngine.ts`
- `src/cli/*`
- `src/remote/*`

## 변경 시 체크포인트

- 이 폴더의 타입/스키마 변경은 외부 클라이언트나 데스크톱 앱, 원격 세션 호환성에 직접 영향을 줍니다.
- runtime과 schema가 어긋나지 않도록 `sdk/*`와 실제 message mapper를 함께 확인해야 합니다.
