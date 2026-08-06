# Create

## 1. 목적

브랜드 가이드라인에 맞는 디자인 산출물을 만듭니다.

의도한 방향은 가이드라인을 직접 읽는 대신 [Review](review.md)를 검증 skill로 쓰고, 이미지가 필요하면 [Image](image.md)를 호출하는 것입니다. 다만 아래 표시대로 현재 구현은 **템플릿 기반 조합(PNG, canonical HTML은 인쇄용 TIFF·PDF 추가)**까지이고, 규정 주입·검증·이미지 생성은 로드맵입니다.

## 2. 핵심 계약

### 현재 구현

조합과 HTML 렌더는 클라이언트에서 일어나며 서버 렌더링·이미지 생성·영속이 없습니다. 인쇄용 TIFF와 PDF는 브라우저가 렌더한 PNG를 서버에서 변환합니다.

- `TemplateGenerator`(`src/components/studio/template/`): 카테고리별 드롭다운에서 published 템플릿을 선택하고 canonical HTML의 열린 텍스트 슬롯을 편집해 미리보기를 렌더.
- `export-template.client`(`src/features/template-export/services/`): Create·Chat의 `png | tiff | pdf` 가용 조건과 Strategy Registry 실행 계약을 공유.
- `use-template-export`(`src/features/template-export/hooks/`): export use case의 진행·오류 UI 상태를 공유.
- `render-template-export-stage.client`(`src/features/template-export/services/`): 검증된 HTML을 Shadow DOM의 공용 export stage로 안전하게 구성.
- `export-template-png.client`(`src/features/template-export/services/`): 공용 export stage를 `html-to-image`로 PNG 다운로드 또는 TIFF·PDF 입력용 PNG Blob으로 렌더.
- `export-template-print`(`src/features/template-export/`): 발행된 canonical HTML 템플릿의 운영자 PPI 정책과 PNG 픽셀 크기를 확인한 뒤 Sharp로 CMYK/ICC 변환하고 TIFF 또는 PDF 생성.

- 입력: 발행된 템플릿의 canonical `html` + 열린 텍스트 슬롯 값. 슬롯은 `inputFormat`/`maxLength`/`maxLines`를 강제.
- 🔴 사용자 미리보기는 `<iframe sandbox="">`(opaque origin)이라 CSS `mask-image` fetch가 CORS 모드로 나갑니다. ACAO 헤더가 없는 업로드 파일 경로(`/api/brand-logos/file/*`)가 차단되면 mask가 전체 투명 처리돼 로고가 사라집니다. 어드민은 same-origin 렌더라 재현되지 않습니다.
- 출력: 클라이언트 PNG 다운로드. 운영자가 `72`(대형 인쇄)·`150`(일반 용지)·`300`(고급 용지)ppi 중 하나를 지정한 경우 CMYK TIFF와 CMYK PDF를 직접 다운로드할 수 있음. Payload에는 아무것도 쓰지 않음(생성 세션/출력 레코드 없음).

TIFF는 원본 가로·세로 픽셀을 리샘플링하지 않고 PPI 메타데이터만 기록합니다. PDF는 문서 전체 DPI 메타데이터 대신 같은 PPI로 계산한 실제 `가로 mm × 세로 mm` 페이지 크기를 씁니다. 따라서 두 형식의 인쇄 크기는 `px ÷ ppi × 25.4mm`로 정해집니다. 두 형식 모두 투명 영역을 흰색으로 평탄화하고 Sharp 내장 기본 CMYK ICC 프로파일로 변환합니다. PDF는 변환된 CMYK JPEG를 원본 픽셀 크기 그대로 배치한 단일 raster 페이지이며 이미지 색공간은 `DeviceCMYK`입니다. 최대 인쇄 입력은 `67,108,864`픽셀·PNG 20MB이며, PPI를 설정할 때 픽셀 상한을 Template 저장 hook에서 검증합니다.

인쇄 내보내기 때 브라우저는 화면을 렌더한 published Template의 `updatedAt`을 export version으로 함께 보냅니다. 서버의 현재 published version과 다르면 `409`로 중단하므로 운영자 변경 뒤 이전 PPI로 표시된 화면에서 다른 규격이 조용히 출력되지 않습니다. TIFF·PDF 변환 Route는 함께 프로세스당 동시 변환 1건, 전체 분당 30건, 클라이언트당 분당 6건으로 제한합니다. 다중 서버 배포 시 이 process-local 제한은 공유 edge/Redis limiter로 교체해야 합니다.

### 그래픽 생성 계약

`generate-graphic`은 발행된 Plugin의 구현 키로 그래픽 도구를 선택하고, 도구별 입력 계약으로 Controller와 최종 생성을 연결하는 Feature입니다.
현재는 첫 도구인 `forward-straight-v1`의 입력 계약, 계약 기반 Studio Controller, 순수 geometry, p5 instance-mode Preview, SVG 브라우저 다운로드를 `/studio/generate/graphic`에 연결했습니다. Controller 변경과 캔버스 포인터·X/Y 슬라이더 입력은 같은 입력 상태를 갱신하며 Preview와 SVG 출력이 이를 공유합니다.

- 입력 계약: `variableWeightEnabled`, `viewpoint`, `angleIntensity`, 정규화된 `origin(0~1)`
- Controller 계약: Studio가 입력 계약의 `boolean`·`select` 항목을 자체 컴포넌트로 렌더
- 출력 계약: 첫 형식은 `image/svg+xml`
- 실행 계약: p5는 Page 미리보기만 담당하고, 최종 SVG는 같은 순수 geometry를 브라우저에서 직렬화해 다운로드
- 기록 계약: Template의 PNG export처럼 Payload, DB, 오브젝트 스토리지에 기록하지 않음

### 의도된 방향 (미구현)

- 가이드라인·rule 데이터 실시간 주입으로 규정 준수 유도(soft: 프롬프트 컨텍스트 / hard: Review checker 재검증) — 강도 미정.
- Review를 검증 skill로 연결(현재 코드 미연결).
- Image 호출로 필요한 에셋 생성(현재 미호출).
- 컴포저 저장(cells→템플릿) 및 생성 출력 영속.
- 작업 재개나 복수 출력 관리가 필요해질 때 생성 세션 영속.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/studio/template` → 첫 사용 가능 템플릿 → 카테고리별 드롭다운 선택 → TemplateGenerator. 발행된 canonical HTML 템플릿만 읽고 비로그인 공개 읽기 |
| [Page](../surfaces/page.md) — Graphic | 구현 | Studio의 `Graphic` 메뉴 → `/studio/generate/graphic` → 계약 기반 Controller·p5 Preview·SVG 다운로드 |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `findTemplatesForRequest` + `prepareTemplateImage`(슬롯 검증 후 첨부 PNG) |
| [REST](../surfaces/rest.md) | 부분 | 인쇄 변환 `POST /api/templates/{templateId}/exports/{format}`(`format`: `pdf`·`tiff`), import 어댑터 `POST /api/templates/import-figma-html`. 모두 산출물 레코드를 저장하지 않음 |
| Slack | 계획 | — |

## 4. 의존

- 클라이언트 라이브러리: `html-to-image`(PNG 캡처).
- 서버 라이브러리: 기존 `sharp`(흰 배경 평탄화, CMYK/ICC 변환, TIFF LZW·JPEG 인코딩, PPI 메타데이터), 기존 `pdf-lib`(CMYK JPEG를 mm 단일 페이지 PDF로 직렬화). 별도 인쇄 라이브러리는 추가하지 않습니다.
- 공유 클라이언트 renderer: `render-template-export-stage.client`(Create·Chat·PNG·TIFF·PDF 공유).
- Payload 컬렉션: `templates`·`template-categories`·`application-images`·`generated-images`(`template-assets`는 레거시 import staging 참조만 유지). 템플릿은 Rule 또는 Check 참조를 저장하지 않습니다. 모든 HTML 저장은 구조 파서와 허용 목록으로 실행 가능한 마크업·외부 URL을 먼저 차단하고, **발행(publish) 시** 공개 URL을 published 공식 에셋 참조와 추가 대조합니다. `generatedImageId`와 canonical URL을 함께 저장한 AI 배경 이미지는 `generated-images`의 ID·URL과 일치할 때 발행할 수 있고, 구조화 참조가 없는 `template-assets`와 raster data URI 배경은 draft에서만 허용합니다. Draft 원본(`baseHtml`)과 staging 에셋은 manager/admin만 읽을 수 있고, Admin Draft 미리보기는 script 없는 iframe으로 격리합니다. `templates`·`brand-logos`·`application-images`·`generated-images`의 공개/worker 읽기는 published 문서만, 쓰기는 manager/admin만 허용합니다. 프레임에 할당한 이미지는 Admin 레이어 편집에서 `imageTransform` override(이동·확대·회전)로 자유 편집할 수 있고, compose가 이 값을 이미지 캐리어 요소의 CSS `transform`으로만 적용합니다(`baseHtml` 불변, 캐리어 없는 레거시 프레임 배경은 무시). 단색 라인 아트 생성 이미지는 `imageColorize` override(선·배경 브랜드 컬러)로 다시 칠할 수 있고, compose가 캐리어를 luminance 마스크 2겹(바닥=선 색, 오버레이=생성 이미지를 `mask-image`로 쓴 배경 색)으로 재구성하며 에셋 참조는 마스크 URL을 가진 오버레이로 옮겨 발행 대조를 유지합니다(캐리어 전용, `backgroundImage` 없으면 무시).
- Figma import(`src/features/template-import/`): frame을 normalize(판단)→에셋 해석→emit(방출) 파이프라인으로 `baseHtml`/`html`에 변환합니다. CSS로 보존 가능한 레이어는 편집 구조를 유지하고, 벡터는 SVG로 받습니다. 단일 IMAGE fill은 서브트리를 굽지 않고 fill 원본을 `background-image` + 에셋 메타데이터로 낮추고(하위 텍스트 레이어 보존), SOLID/GRADIENT 스택은 다중 배경 레이어로, 순수 회전은 CSS `transform`으로 옮깁니다. TEXT_PATH·알 수 없는 leaf node·PATTERN/VIDEO fill·겹쳐진 IMAGE fill·마스크 합성·스케일/기울임 변환·지원 밖 효과·비 CSS 블렌드만 PNG Figma render로 고정하며, 고정된 레이어는 이유·삼킨 텍스트 수를 진단으로 Admin 가져오기 경고에 노출합니다. 렌더·fill 에셋은 `application-images` draft로 저장하며, Template publish 때 최종 HTML에도 남은 Figma import 에셋만 같은 트랜잭션에서 함께 publish합니다(배경 fill 참조는 div의 `data-asset-*` + 단일 style url로 대조). Template 문서를 자동 생성하지는 않고 manager가 Admin에서 저장합니다.
- Review 미사용, Image 미호출(현재) — 위 "의도된 방향" 참조.

### 기술 Feature 경계

| Feature | 책임 | 출력 |
| --- | --- | --- |
| `template-import` | 외부 템플릿을 가져와 운영자가 편집·검증·발행 가능한 상태로 준비 | 저장 가능한 Template |
| `template-create` | published Template의 슬롯 값을 입력하고 결과를 조합 | composed HTML |
| `template-export` | composed HTML을 출력 정책에 따라 변환 | PNG·TIFF·PDF |
| `generate-graphic` | Plugin 구현 키와 도구별 입력 계약으로 그래픽을 계산·미리보기·출력 | SVG 브라우저 다운로드 |

공용 template 타입·HTML 합성·슬롯 수집·render model projection은 `src/types`와 `src/services`가 소유합니다. `template-create`는 `template-export`의 공개 hook과 print policy를 사용할 수 있지만, `template-create`와 `template-export`는 `template-import` 내부 구현을 직접 import하지 않습니다.

## 5. 크로스커팅

- 생성 실행 경계(Agent/Worker): [05. 시스템 아키텍처](../05-system-architecture.md)
- 인가된 에셋·업로드·접근 제어: [07. 보안](../07-security.md)
- 사용자 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리): [04. 도메인 모델](../04-domain-model.md) — §5의 `AssetGenerationSession`은 향후 제작 사용량 추적용 계획 모델입니다. 현재 Create에는 세션·출력 영속 요구가 없습니다.
