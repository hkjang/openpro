# `src/plugins` 폴더 문서

## 역할

`src/plugins`는 내장 플러그인과 bundled plugin의 시작점입니다.  
실제 설치/캐시/로딩은 `utils/plugins`와 `services/plugins`가 더 많이 담당하지만, “어떤 plugin이 기본 제공되는가”를 이 폴더가 정의합니다.

## 대표 파일

| 파일 | 역할 |
|---|---|
| `builtinPlugins.ts` | 기본 제공 plugin 정의 |
| `bundled/index.ts` | bundled plugin 초기화 |

## 주요 연결 지점

- `src/main.tsx`
- `src/commands/plugin/*`
- `src/utils/plugins/*`
- `src/services/plugins/*`

## 변경 시 체크포인트

- plugin load order와 trust 정책, cache invalidation을 함께 확인해야 합니다.
- builtin plugin 정의를 바꾸면 문서/온보딩/설정 UI도 영향 받을 수 있습니다.
