import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { type IconGridItem, IconGridView } from './icon-grid-view'

/**
 * 아이콘 그리드 블록 — Essenherb 아이콘을 8×5 그리드로 전시한다.
 * 브랜드 무관: 형태·이름·그룹은 brand-icons 컬렉션, 색 조합은 icon-colorway Global(팔레트 참조)에서 읽는다.
 * manager 설정(블록 필드): 컬러/흑백(colored) · 셀 높이 · SVG 크기 · SVG 수직 이동.
 * 뷰어 인터랙션(태그 필터·색상 반전·랜덤 섞기)은 클라이언트 IconGridView가 담당한다.
 */
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type IconGridType = Extract<GuidelineBlock, { blockType: 'iconGrid' }>

const DEFAULT_LAYOUT = { heightPct: 100, svgPct: 70, offsetPct: 0 }

const relId = (value: unknown): string | number | undefined =>
	value != null && typeof value === 'object'
		? (value as { id: string | number }).id
		: (value as string | number | undefined)
const relHex = (value: unknown): string | undefined =>
	value != null && typeof value === 'object' ? (value as { hex?: string }).hex : undefined

export async function IconGridBlock({ block }: { block: IconGridType }) {
	const payload = await getPayload({ config })
	const [iconsRes, colorway] = await Promise.all([
		payload.find({ collection: 'brand-icons', sort: 'createdAt', limit: 200, depth: 0 }),
		payload.findGlobal({ slug: 'icon-colorway', depth: 1 }),
	])

	// iconId → { fg, bg } 팔레트 hex (컬러 모드에서만 사용).
	const colorByIcon = new Map<string | number, { fg?: string; bg?: string }>()
	for (const entry of colorway.entries ?? []) {
		const iconId = relId(entry.icon)
		if (iconId != null) colorByIcon.set(iconId, { fg: relHex(entry.fg), bg: relHex(entry.bg) })
	}

	const items: IconGridItem[] = iconsRes.docs.map((icon, index) => ({
		id: icon.id,
		n: index + 1,
		name: icon.name,
		group: icon.group ?? '',
		src: icon.url ?? `/api/brand-icons/file/${icon.filename}`,
		ratio: icon.width && icon.height ? `${icon.width} / ${icon.height}` : '1 / 1',
		fgHex: colorByIcon.get(icon.id)?.fg,
		bgHex: colorByIcon.get(icon.id)?.bg,
	}))

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
