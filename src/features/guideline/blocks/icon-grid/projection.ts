import type { GuidelineBlock } from '../types'

type IconGrid = Extract<GuidelineBlock, { blockType: 'iconGrid' }>

// 아이콘은 하드코딩된 브랜드 자산(SVG)이라 CMS 참조 자산이 없다. 근거 텍스트는 제목뿐.
export function projectIconGrid(block: IconGrid) {
	const title = block.title?.trim() || undefined
	return {
		text: title ?? 'Icon grid',
		evidence: { type: 'iconGrid' as const, title, colored: block.colored ?? false },
		referenceAssets: [],
	}
}

export default projectIconGrid
