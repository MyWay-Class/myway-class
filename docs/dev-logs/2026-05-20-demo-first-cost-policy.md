# 2026-05-20 demo-first-cost-policy

- Spring backend의 기본 AI provider를 non-dev 포함 `demo` 우선으로 조정했다.
- STT 기본 provider를 `demo` 우선으로 조정하고 callback 자동 전사의 하드코딩 provider 전달을 제거했다.
- Workers backend STT fallback 체인도 `demo -> cloudflare -> gemini` 순서로 통일했다.
- 관련 계약/통합 테스트 기대값을 정책과 일치하도록 갱신했고, 핵심 테스트를 통과했다.
