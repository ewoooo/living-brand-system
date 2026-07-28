# Create

## 1. 목적

브랜드 가이드라인에 맞는 디자인 산출물을 만듭니다.

의도한 방향은 가이드라인을 직접 읽는 대신 [Review](review.md)를 검증 skill로 쓰고, 이미지가 필요하면 [Image](image.md)를 호출하는 것입니다. 다만 아래 표시대로 현재 구현은 **템플릿 기반 조합(클라이언트 PNG)**까지이고, 규정 주입·검증·이미지 생성은 로드맵입니다.

## 2. 핵심 계약

### 현재 구현

조합은 전부 클라이언트에서 일어나며 서버 렌더링·이미지 생성·영속이 없습니다. 재사용 단위는 Studio의 `/studio/template`과 AI Chat이 공유하는 트리오입니다.

- `TemplateRenderer`(`src/components/template-renderer.tsx`): `JsonTemplate`(+열린 슬롯 `values`)를 DOM으로 렌더. 서버/클라 공용.
- `use-template-png-export`(`src/hooks/`): 렌더러를 원본 크기로 오프스크린 마운트 후 `html-to-image`로 PNG 캡처 → 브라우저 다운로드.
- `collectOpenSlotElements()`(`src/types/json-template.ts`): `locked === false` 슬롯만 순회하는 단일 traversal.

- 입력: 발행된 템플릿의 `jsonTemplate` + 열린 슬롯 `values(text/src)`. 텍스트 슬롯은 `inputFormat`/`maxLength`/`maxLines`를 강제.
- 출력: 클라이언트 PNG 다운로드. Payload에는 아무것도 쓰지 않음(생성 세션/출력 레코드 없음).

템플릿 상세 페이지는 `AssetGenerator`로 열린 슬롯을 채우고 PNG를 내려받습니다. `grid`가 있는 템플릿도 저장된 요소 좌표를 그대로 렌더링하므로, 별도 저작 POC로 역변환하지 않습니다. 기존 `GridComposer` POC는 실행 코드에서 제거하고 `archive/deprecated/grid-composer`에 격리 보관합니다.

### 의도된 방향 (미구현)

- 가이드라인·rule 데이터 실시간 주입으로 규정 준수 유도(soft: 프롬프트 컨텍스트 / hard: Review checker 재검증) — 강도 미정.
- Review를 검증 skill로 연결(현재 코드 미연결).
- Image 호출로 필요한 에셋 생성(현재 미호출).
- 컴포저 저장(cells→템플릿) 및 생성 세션/출력 영속.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/studio/template` → 카테고리 → 템플릿 → AssetGenerator. 발행된 템플릿만 읽고 비로그인 공개 읽기 |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `findTemplatesForRequest` + `prepareTemplateImage`(슬롯 검증 후 첨부 PNG) |
| REST | 부분 | 생성용 REST는 없음. import 어댑터 `POST /api/templates/import-figma-html`만 |
| Slack | 계획 | — |

## 4. 의존

- 클라이언트 라이브러리: `html-to-image`(PNG 캡처).
- 공유 훅: `use-template-png-export`(Create·Chat 공유).
- Payload 컬렉션: `templates`·`template-categories`·`application-images`(`template-assets`는 레거시 import staging 참조만 유지). 템플릿은 임베디드 Check를 relationship으로 참조하지 않고 `templateChecks[].checkKey`를 저장합니다. 모든 HTML 저장은 구조 파서와 허용 목록으로 실행 가능한 마크업·외부 URL을 먼저 차단하고, **발행(publish) 시** 공개 URL을 published 공식 에셋 참조와 추가 대조합니다. `template-assets`와 magic byte가 확인된 raster AI 배경 이미지는 draft에서만 허용합니다. Draft 원본(`baseHtml`)과 staging 에셋은 manager/admin만 읽을 수 있고, Admin Draft 미리보기는 script 없는 iframe으로 격리합니다. `templates`·`brand-logos`·`application-images`의 공개/worker 읽기는 published 문서만, 쓰기는 manager/admin만 허용합니다.
- Figma import(`src/features/template-import/`): frame을 `baseHtml`/`html`로 변환합니다. CSS로 보존 가능한 레이어는 편집 구조를 유지하고, 벡터는 SVG, TEXT_PATH·알 수 없는 leaf node·IMAGE/PATTERN/VIDEO fill·마스크 합성·비정상 변환·지원 밖 효과는 PNG Figma render로 고정합니다. 렌더 에셋은 `application-images` draft로 저장하며, Template publish 때 최종 HTML에도 남은 Figma import 에셋만 같은 트랜잭션에서 함께 publish합니다. Template 문서를 자동 생성하지는 않고 manager가 Admin에서 저장합니다.
- Review 미사용, Image 미호출(현재) — 위 "의도된 방향" 참조.

## 5. 크로스커팅

- 생성 실행 경계(Agent/Worker): [05. 시스템 아키텍처](../05-system-architecture.md)
- 인가된 에셋·업로드·접근 제어: [07. 보안](../07-security.md)
- 사용자 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리): [04. 도메인 모델](../04-domain-model.md) — §5의 `AssetGenerationSession`/`Output` 등 aggregate는 현재 aspirational(미구현)이며, 실제 구현이 앞설 때 문서와 맞춥니다.
