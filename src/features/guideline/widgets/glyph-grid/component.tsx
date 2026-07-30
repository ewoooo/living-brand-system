import { GlyphGridBody } from '@/features/guideline/blocks/glyph-grid/component'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/glyph-grid) 통째 삭제.
//
// 위젯: 프레임/헤더 없는 시각 본체만 렌더한다. author 인스턴스(title/서체 선택) 비의존 —
// 서체는 선택 없음(null)으로 두어 --font-title 토큰으로 폴백한다(브랜드 무관).
// 뷰는 blocks/glyph-grid의 GlyphGridBody를 그대로 재사용(새 스타일 X). 서버 데이터 조회 없음.
export async function GlyphGridWidget() {
	return <GlyphGridBody typeface={null} />
}

export default GlyphGridWidget
