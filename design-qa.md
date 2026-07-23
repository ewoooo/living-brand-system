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
