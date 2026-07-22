import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { ICON_COLORWAY } from './colorway'
import { type IconGridItem, IconGridView } from './icon-grid-view'

/**
 * 아이콘 그리드 블록 — Essenherb 아이콘을 8×5 그리드로 전시한다.
 * 브랜드 무관: 형태·이름·그룹은 brand-icons 컬렉션에서 읽는다.
 * 색 조합은 정적 colorway(팔레트 색 이름 참조) + brand-colors 런타임 해석으로 얻는다(colorway.ts 참고).
 * manager 설정(블록 필드): 컬러/흑백(colored) · 셀 높이 · SVG 크기 · SVG 수직 이동.
 * 뷰어 인터랙션(태그 필터·색상 반전·랜덤 섞기)은 클라이언트 IconGridView가 담당한다.
 */
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type IconGridType = Extract<GuidelineBlock, { blockType: 'iconGrid' }>

const DEFAULT_LAYOUT = { heightPct: 100, svgPct: 70, offsetPct: 0 }

export async function IconGridBlock({ block }: { block: IconGridType }) {
	const payload = await getPayload({ config })
	const [iconsRes, colorsRes] = await Promise.all([
		payload.find({ collection: 'brand-icons', sort: 'createdAt', limit: 200, depth: 0 }),
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0 }),
	])

	// 팔레트 색 이름 → hex. colorway가 색을 이름으로 참조하므로 런타임에 해석한다(팔레트 hex 변경 시 따라감).
	const hexByName = new Map<string, string>()
	for (const color of colorsRes.docs) {
		if (color.name && color.hex) hexByName.set(color.name, color.hex)
	}

	const items: IconGridItem[] = iconsRes.docs.map((icon, index) => {
		const combo = icon.filename ? ICON_COLORWAY[icon.filename] : undefined
		return {
			id: icon.id,
			n: index + 1,
			name: icon.name,
			group: icon.group ?? '',
			src: icon.url ?? `/api/brand-icons/file/${icon.filename}`,
			ratio: icon.width && icon.height ? `${icon.width} / ${icon.height}` : '1 / 1',
			fgHex: combo ? hexByName.get(combo.fg) : undefined,
			bgHex: combo ? hexByName.get(combo.bg) : undefined,
		}
	})

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			<IconGridView
				items={items}
				colored={block.colored ?? false}
				heightPct={block.cellHeightPct ?? DEFAULT_LAYOUT.heightPct}
				svgPct={block.svgSizePct ?? DEFAULT_LAYOUT.svgPct}
				offsetPct={block.svgOffsetPct ?? DEFAULT_LAYOUT.offsetPct}
			/>
		</GuidelineBlockFrame>
	)
}

export default IconGridBlock
