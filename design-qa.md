# Root scale design QA

- Source visual truth: `/private/tmp/anduril-header-live.png`
- Implementation screenshot: `/private/tmp/lbs-root-scale-1280.png`
- Combined comparison: `/private/tmp/root-scale-header-comparison.png`
- Viewport: 1280 × 720 CSS px
- Source pixels: 1280 × 720
- Implementation pixels: 1280 × 720
- Device scale factor: 1
- State: desktop header, menus closed

## Full-view comparison

Anduril과 LBS를 같은 viewport에서 나란히 비교했다. 두 화면 모두 루트 크기 14px을 기준으로 헤더 메뉴가 렌더되며, LBS의 메뉴 크기도 14px로 계산된다. 제품별 글꼴·간격·색상·문구는 각 디자인 시스템의 의도된 차이로 유지했다.

## Focused region comparison

이번 변경 대상이 헤더와 전역 `rem` 기준 크기이므로 전체 화면 상단이 focused region을 겸한다. 별도 확대 비교는 필요하지 않았다.

## Required fidelity surfaces

- Fonts and typography: 390/1280px 14px, 1440px 16px, 1920px 18px, 2400px 20px로 확인했다.
- Spacing and layout rhythm: 루트 변화가 `rem` 기반 간격에 함께 반영되며 1280px 헤더에서 잘림이나 겹침이 없다.
- Colors and visual tokens: 변경 없음.
- Image quality and asset fidelity: 변경 대상 이미지 없음.
- Copy and content: 변경 없음.

## Findings

P0/P1/P2 차이 없음.

## Comparison history

- Initial pass: 루트 크기와 헤더 계산값이 목표 범위와 일치해 수정 없이 통과.

## Verification

- Primary interaction: 헤더의 닫힌 상태 렌더링 확인.
- Console errors: 없음.
- Automated checks: Biome 통과, Vitest 473개 통과, TypeScript 통과.
- Production build: 기존 로컬 개발 서버와 `.next`를 공유한 상태에서 최적화 단계가 대기해 중단.

final result: passed

---

# Hero Footer Design QA

- Source visual truth: `/var/folders/sv/yv7g3gc948x836bgzcfmrhnh0000gn/T/codex-clipboard-c9c89b41-46a4-4bb7-b778-e481d9be757c.png`
- Implementation screenshot: `/Users/plusx/.codex/visualizations/2026/07/24/019f9201-9a50-7212-a48d-d71393966b27/hero-footer-desktop-final.png`
- Full-view comparison: `/Users/plusx/.codex/visualizations/2026/07/24/019f9201-9a50-7212-a48d-d71393966b27/hero-footer-full-comparison-final.png`
- Focused footer comparison: `/Users/plusx/.codex/visualizations/2026/07/24/019f9201-9a50-7212-a48d-d71393966b27/hero-footer-component-comparison-final.png`
- Mobile implementation: `/Users/plusx/.codex/visualizations/2026/07/24/019f9201-9a50-7212-a48d-d71393966b27/hero-footer-mobile.png`
- State: 홈 화면을 Hero Footer까지 스크롤한 다크 테마

## Capture normalization

- Source: 5224 × 2924 px, 1440 × 806 px로 정규화
- Implementation: CSS viewport 1440 × 806, device pixel ratio 1, screenshot 1440 × 806 px
- Focused comparison: source `y=176`과 implementation `y=241`에서 각각 1440 × 565 px의 Footer 영역을 정렬
- Mobile: CSS viewport 390 × 844, screenshot 390 × 844 px

## Findings

- P0/P1/P2 차이 없음.
- 레퍼런스의 오렌지 대신 CMS가 주입한 `primary` 브랜드 컬러를 사용한 것은 제품 토큰 계약에 따른 의도적 차이입니다.
- 레퍼런스의 SEED 자산과 문구는 LBS 공식 로고, 제품 문구, 실제 라우트로 대체했습니다.
- 레퍼런스의 상단 검은 프레임은 기존 Hero Feature 영역이 소유하므로 Footer 비교 범위에서 제외했습니다.

## Required fidelity surfaces

- Fonts and typography: 상단 정보는 기존 `Typography`, 하단 워드마크는 Pretendard 가변 폰트의 굵은 산세리프를 사용해 레퍼런스의 대비를 재현했습니다.
- Spacing and layout rhythm: 좌측 브랜드 정보, 우측 3열 링크, 중앙 정렬된 대형 워드마크의 비례를 유지했습니다.
- Colors and visual tokens: `bg-primary`와 `text-primary-foreground`만 사용해 런타임 브랜드 색과 대비를 보존했습니다.
- Image quality and asset fidelity: 기존 `/logos/logo.svg`를 작은 브랜드 마크와 대형 워드마크에 재사용했습니다.
- Copy and content: LBS 제품 설명, CMS 회사명, 실제 Guideline/Studio/System 경로를 사용했습니다.

## Responsive and interaction checks

- 390 px viewport에서 문서 `scrollWidth`와 `innerWidth`가 모두 390 px로 수평 오버플로가 없습니다.
- Footer의 Overview 링크가 `/guideline`로 이동하는 것을 브라우저에서 확인했습니다.
- 최종 데스크톱 검증에서 브라우저 콘솔 오류는 0건입니다.

## Comparison history

1. 첫 비교에서 장식 그리드가 Footer 위에 비치고, 워드마크가 레퍼런스보다 작고 아래에 배치된 P2 차이를 확인했습니다.
2. Footer를 `relative z-10`으로 올리고, 워드마크를 `font-body` 산세리프로 변경해 확대·중앙 정렬했습니다.
3. 수정 후 데스크톱과 모바일을 다시 캡처했으며 추가 P0/P1/P2 차이가 없습니다.

final result: passed

---

# Studio Examples design QA

- Source visual truth: `/var/folders/sv/yv7g3gc948x836bgzcfmrhnh0000gn/T/codex-clipboard-86fb7b15-573c-43c4-b53e-7569b1e1883a.png`
- Implementation: browser-rendered `http://localhost:3012/studio/examples`
- Viewport: 2048 × 1152 CSS px, device scale factor 1
- Source pixels: 5684 × 3284 at 144 dpi; implementation screenshot: 2048 × 1152 at 72 dpi
- Normalization: the source and implementation were compared in one 2048 × 2304 composite. The source was resized to the desktop viewport for composition; its surrounding product shell is intentionally not treated as a fidelity target.
- State: dark system theme, all examples selected, Studio side navigation expanded.

## Findings

No actionable P0, P1, or P2 findings.

- Fonts and typography: the reference uses compact sans-serif card titles; the implementation retains LBS body typography and its existing heading scale. This is an intentional product-system constraint, while preserving the title → description → tag hierarchy.
- Spacing and layout rhythm: the content column, filter placement, three-column grid, card padding, large card radius, and bottom-aligned tags follow the reference composition. LBS’s wider card height and persistent shell are intentional to preserve the existing Studio frame.
- Colors and visual tokens: the reference’s light neutral surface is adapted to LBS’s active dark theme using existing semantic tokens. The colored icon accents and bordered tags maintain the requested gallery rhythm without introducing a separate palette.
- Image quality and asset fidelity: the reference has no content imagery. The implementation uses the project’s Carbon icon set for semantic card icons; no placeholder imagery or custom drawings were introduced.
- Copy and content: Korean mock examples describe realistic brand-production starting points and use clear category/tag labels.

## Interaction and console evidence

- The accessible `예제 필터` combobox is rendered in the browser.
- `filterStudioExamples('이미지')` is covered by `src/components/studio/studio-examples.test.tsx` and returns only the two image examples.
- Browser console errors: none.

## Focused comparison

The filter and first two rows of cards were readable in the full desktop comparison, so a separate crop was not needed. The comparison confirmed icon placement, title/description hierarchy, and bottom tag alignment.

## Comparison history

1. Initial browser capture: the all-examples page rendered with a centered heading, filter, and three-column card gallery. No P0/P1/P2 differences were found after accounting for the intentional LBS shell and dark theme.

## Implementation checklist

- [x] Add `/studio/examples` and its Studio navigation entry.
- [x] Render a responsive examples grid with existing LBS components.
- [x] Provide category filtering and a focused filter-logic test.
- [x] Check browser console errors and compare against the supplied reference.

final result: passed
