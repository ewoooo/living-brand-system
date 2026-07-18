# Guideline UI Kit POC

Status: **Alpha / development-only**

- `/guideline/kit`은 `NODE_ENV=development`에서만 갤러리를 동적 로드한다.
- production에서는 해당 경로를 `404`로 닫는다.
- 이 폴더 전체가 제품 데이터 흐름의 일부가 아니다. 제품이 쓰는 컴포넌트(`Carousel`, `ColorSwatch`)는 `../blocks/children`이 소유한다.
- 실제 Payload block renderer에 연결되는 컴포넌트만 검증 후 제품 경로로 옮긴다.
- 블록화 로드맵은 `docs/superpowers/specs/2026-07-17-guideline-kit-block-classification.md`를 따른다.
