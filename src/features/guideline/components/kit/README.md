# Guideline UI Kit POC

Status: **Alpha / development-only**

- `/guideline/kit`은 `NODE_ENV=development`에서만 갤러리를 동적 로드한다.
- production에서는 해당 경로를 `404`로 닫는다.
- 이 폴더의 mock 컴포넌트는 현재 제품 데이터 흐름의 일부가 아니다.
- 실제 Payload block renderer에 연결되는 컴포넌트만 검증 후 제품 경로로 옮긴다.
