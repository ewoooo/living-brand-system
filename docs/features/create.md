# Create

## 1. 목적

브랜드 가이드라인에 맞는 디자인 산출물을 만듭니다.

의도한 방향은 가이드라인을 직접 읽는 대신 [Review](review.md)를 검증 skill로 쓰고, 이미지가 필요하면 [Image](image.md)를 호출하는 것입니다. 다만 아래 표시대로 현재 구현은 **템플릿 기반 조합(PNG, canonical HTML은 인쇄용 TIFF·PDF 추가)**까지이고, 규정 주입·검증·이미지 생성은 로드맵입니다.

## 2. 핵심 계약

### 현재 구현

조합과 HTML 렌더는 클라이언트에서 일어나며 서버 렌더링·이미지 생성·영속이 없습니다. 인쇄용 TIFF는 브라우저가 렌더한 PNG를 서버에서 변환하고, PDF는 같은 PNG를 클라이언트에서 단일 페이지 문서로 만듭니다.

- `TemplateGenerator`(`src/components/studio/template/`): canonical HTML의 열린 텍스트 슬롯을 편집하고 미리보기를 렌더.
- `export-template.client`(`src/features/template-export/services/`): Create·Chat의 `png | tiff | pdf` 가용 조건과 Strategy Registry 실행 계약을 공유.
- `use-template-export`(`src/features/template-export/hooks/`): export use case의 진행·오류 UI 상태를 공유.
- `render-template-export-stage.client`(`src/features/template-export/services/`): 검증된 HTML을 Shadow DOM의 공용 export stage로 안전하게 구성.
- `export-template-png.client`(`src/features/template-export/services/`): 공용 export stage를 `html-to-image`로 PNG 다운로드 또는 TIFF·PDF 입력용 PNG Blob으로 렌더.
- `export-template-tiff`(`src/features/template-export/`): 발행된 canonical HTML 템플릿의 운영자 PPI 정책과 PNG 픽셀 크기를 확인한 뒤 Sharp로 CMYK TIFF 변환.
- `export-template-pdf.client`(`src/features/template-export/services/`): 흰 배경 PNG를 PPI 기준 mm 단일 페이지 RGB PDF로 만들어 직접 다운로드.

- 입력: 발행된 템플릿의 canonical `html` + 열린 텍스트 슬롯 값. 슬롯은 `inputFormat`/`maxLength`/`maxLines`를 강제.
- 출력: 클라이언트 PNG 다운로드. 운영자가 `72`(대형 인쇄)·`150`(일반 용지)·`300`(고급 용지)ppi 중 하나를 지정한 경우 CMYK TIFF와 RGB PDF를 직접 다운로드할 수 있음. Payload에는 아무것도 쓰지 않음(생성 세션/출력 레코드 없음).

TIFF는 원본 가로·세로 픽셀을 리샘플링하지 않고 PPI 메타데이터만 기록합니다. PDF는 문서 전체 DPI 메타데이터 대신 같은 PPI로 계산한 실제 페이지 크기를 씁니다. 따라서 두 형식의 인쇄 크기는 `px ÷ ppi × 25.4mm`로 정해집니다. TIFF의 투명 영역은 흰색으로 평탄화하고 Sharp 내장 기본 CMYK ICC 프로파일을 삽입합니다. PDF는 흰 배경 PNG를 원본 픽셀 그대로 배치한 단일 RGB raster 페이지입니다. 최대 TIFF 입력은 `67,108,864`픽셀·PNG 20MB이며, PPI를 설정할 때 픽셀 상한을 Template 저장 hook에서 검증합니다.

TIFF 내보내기 때 브라우저는 화면을 렌더한 published Template의 `updatedAt`을 export version으로 함께 보냅니다. 서버의 현재 published version과 다르면 `409`로 중단하므로 운영자 변경 뒤 이전 PPI로 표시된 화면에서 다른 규격이 조용히 출력되지 않습니다. TIFF 변환 Route는 프로세스당 동시 변환 1건, 전체 분당 30건, 클라이언트당 분당 6건으로 제한합니다. 다중 서버 배포 시 이 process-local 제한은 공유 edge/Redis limiter로 교체해야 합니다.

### 의도된 방향 (미구현)

- 가이드라인·rule 데이터 실시간 주입으로 규정 준수 유도(soft: 프롬프트 컨텍스트 / hard: Review checker 재검증) — 강도 미정.
- Review를 검증 skill로 연결(현재 코드 미연결).
- Image 호출로 필요한 에셋 생성(현재 미호출).
- 컴포저 저장(cells→템플릿) 및 생성 세션/출력 영속.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/studio/template` → 카테고리 → 템플릿 → TemplateGenerator. 발행된 canonical HTML 템플릿만 읽고 비로그인 공개 읽기 |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `findTemplatesForRequest` + `prepareTemplateImage`(슬롯 검증 후 첨부 PNG) |
| REST | 부분 | TIFF 변환 `POST /api/templates/export-tiff`, import 어댑터 `POST /api/templates/import-figma-html`. 둘 다 산출물 레코드를 저장하지 않음 |
| Slack | 계획 | — |

## 4. 의존

- 클라이언트 라이브러리: `html-to-image`(PNG 캡처), `pdf-lib`(PNG를 단일 페이지 PDF로 직렬화).
- 서버 라이브러리: 기존 `sharp`(흰 배경 평탄화, CMYK/ICC 변환, TIFF LZW 압축, PPI 메타데이터). 별도 인쇄 라이브러리는 추가하지 않습니다.
- 공유 클라이언트 renderer: `render-template-export-stage.client`(Create·Chat·PNG·TIFF·PDF 공유).
- Payload 컬렉션: `templates`·`template-categories`·`application-images`(`template-assets`는 레거시 import staging 참조만 유지). 템플릿은 임베디드 Check를 relationship으로 참조하지 않고 `templateChecks[].checkKey`를 저장합니다. 모든 HTML 저장은 구조 파서와 허용 목록으로 실행 가능한 마크업·외부 URL을 먼저 차단하고, **발행(publish) 시** 공개 URL을 published 공식 에셋 참조와 추가 대조합니다. `template-assets`와 magic byte가 확인된 raster AI 배경 이미지는 draft에서만 허용합니다. Draft 원본(`baseHtml`)과 staging 에셋은 manager/admin만 읽을 수 있고, Admin Draft 미리보기는 script 없는 iframe으로 격리합니다. `templates`·`brand-logos`·`application-images`의 공개/worker 읽기는 published 문서만, 쓰기는 manager/admin만 허용합니다.
- Figma import(`src/features/template-import/`): frame을 `baseHtml`/`html`로 변환합니다. CSS로 보존 가능한 레이어는 편집 구조를 유지하고, 벡터는 SVG, TEXT_PATH·알 수 없는 leaf node·IMAGE/PATTERN/VIDEO fill·마스크 합성·비정상 변환·지원 밖 효과는 PNG Figma render로 고정합니다. 렌더 에셋은 `application-images` draft로 저장하며, Template publish 때 최종 HTML에도 남은 Figma import 에셋만 같은 트랜잭션에서 함께 publish합니다. Template 문서를 자동 생성하지는 않고 manager가 Admin에서 저장합니다.
- Review 미사용, Image 미호출(현재) — 위 "의도된 방향" 참조.

### 기술 Feature 경계

| Feature | 책임 | 출력 |
| --- | --- | --- |
| `template-import` | 외부 템플릿을 가져와 운영자가 편집·검증·발행 가능한 상태로 준비 | 저장 가능한 Template |
| `template-create` | published Template의 슬롯 값을 입력하고 결과를 조합 | composed HTML |
| `template-export` | composed HTML을 출력 정책에 따라 변환 | PNG·TIFF·PDF |

공용 template 타입·HTML 합성·슬롯 수집·render model projection은 `src/types`와 `src/services`가 소유합니다. `template-create`는 `template-export`의 공개 hook과 print policy를 사용할 수 있지만, `template-create`와 `template-export`는 `template-import` 내부 구현을 직접 import하지 않습니다.

## 5. 크로스커팅

- 생성 실행 경계(Agent/Worker): [05. 시스템 아키텍처](../05-system-architecture.md)
- 인가된 에셋·업로드·접근 제어: [07. 보안](../07-security.md)
- 사용자 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리): [04. 도메인 모델](../04-domain-model.md) — §5의 `AssetGenerationSession`/`Output` 등 aggregate는 현재 aspirational(미구현)이며, 실제 구현이 앞설 때 문서와 맞춥니다.
