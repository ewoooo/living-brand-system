# Guideline UI Kit POC

Status: **Alpha / development-only · 임시(scratch) 폴더**

> ⚠️ **임시 폴더다.** 라우팅이 숨겨져(dev 전용, prod 404) 있고, 실험용 이미지(`images/`)와
> demo 컴포넌트가 계속 쌓이는 스크래치 공간이다. 여기 있는 건 언제든 정리·삭제 대상이며,
> 검증이 끝난 컴포넌트만 제품 경로로 승격하고 나머지 실험물은 남기지 않는다.

- `/guideline/kit`은 `NODE_ENV=development`에서만 갤러리를 동적 로드한다.
- production에서는 해당 경로를 `404`로 닫는다.
- 이 폴더 전체가 제품 데이터 흐름의 일부가 아니다. 제품이 쓰는 컴포넌트(`Carousel`, `ColorSwatch`)는 `../blocks/children`이 소유한다.
- 실제 Payload block renderer에 연결되는 컴포넌트만 검증 후 제품 경로로 옮긴다.
- 블록화 로드맵은 `docs/superpowers/specs/2026-07-17-guideline-kit-block-classification.md`를 따른다.
