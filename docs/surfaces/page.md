# Page

## 1. 목적

앱의 웹 페이지 표면입니다. 사용자가 브라우저에서 Feature를 쓰는 기본 채널이며, 페이지는 셸일 뿐 핵심 로직은 Feature 코어가 가집니다.

## 2. 어댑터 계약

- 화면은 `src/app/(frontend)/<route>/`에 두고, 공통 셸(헤더·nav·사이드바)을 재사용합니다.
- 서버 상호작용이 필요한 Feature는 `src/app/api/<route>/route.ts` route handler를 통해 코어 service를 호출합니다. 페이지·route는 입력 검증과 인증만 담당하고 외부 I/O는 service가 소유합니다.
- 새 Feature를 Page로 노출하려면: 라우트 추가 → 코어 service 호출 → 헤더 nav에 링크 등록.

## 3. 공통 규칙

- 라우팅·소스 위치·service 경계: [06. 프로젝트 구조와 개발 규칙](../06-project-structure.md)
- 쿠키 인증·교차 출처(CSRF) 방지: [07. 보안](../07-security.md)
- 문구·키보드 접근성·다국어: [08. 접근성과 다국어](../08-accessibility-i18n.md)

## 4. 크로스커팅

이 표면은 위 개념 문서가 이미 규정하므로 별도 규칙을 여기서 복제하지 않습니다. 링크만 유지합니다.
