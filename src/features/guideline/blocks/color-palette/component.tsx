import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { ColorSwatch } from './color-swatch'
import { type PaletteChip, PaletteGrid, type PaletteMainChip } from './palette-grid'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function ColorPaletteBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'colorPalette' }>
}) {
	const colors = block.colors.filter(
		(color): color is BrandColor => typeof color === 'object' && color !== null,
	)

	// tone 있는 색 = 계열 그리드(colorGroup별 행, relationship 순서로 계열 등장 순서 결정, 행 내 tone 오름차순).
	const families = groupFamilies(colors)

	return (
		<GuidelineBlockFrame layout="padded">
			<GuidelineHeader variant="block" title={block.title} />
			{families.length > 0 ? (
				<PaletteGrid main={buildMain(colors, families.length)} families={families} />
			) : (
				// tone/계열 구조가 없는 브랜드는 단순 스와치 그리드로 폴백.
				<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
					{colors.map((color) => (
						<ColorSwatch key={color.id} color={color} />
					))}
				</div>
			)}
		</GuidelineBlockFrame>
	)
}

const toChip = (c: BrandColor): PaletteChip => ({
	id: c.id,
	name: c.name,
	hex: c.hex,
	pantone: c.pantone,
})

// colorGroup별로 묶는다. 계열 등장 순서는 relationship 순서(첫 등장), 행 내부는 tone 오름차순.
function groupFamilies(colors: BrandColor[]): PaletteChip[][] {
	const order: string[] = []
	const byGroup = new Map<string, BrandColor[]>()
	for (const c of colors) {
		if (c.tone == null || !c.colorGroup) continue
		if (!byGroup.has(c.colorGroup)) {
			byGroup.set(c.colorGroup, [])
			order.push(c.colorGroup)
		}
		byGroup.get(c.colorGroup)?.push(c)
	}
	return order.map((g) =>
		[...(byGroup.get(g) ?? [])].sort((a, b) => (a.tone ?? 0) - (b.tone ?? 0)).map(toChip),
	)
}

// main 열: isMain 색. hero(tone 있음)를 먼저, neutral(tone 없음)을 뒤에.
// neutral은 1u, hero들이 남은 높이(그리드 행 수 - neutral 수)를 균등 분할 → main 총 높이 = 행 수.
function buildMain(colors: BrandColor[], gridRows: number): PaletteMainChip[] {
	const mains = colors.filter((c) => c.isMain)
	const heroes = mains.filter((c) => c.tone != null)
	const neutrals = mains.filter((c) => c.tone == null)
	const heroUnits =
		heroes.length > 0 ? Math.max(1, gridRows - neutrals.length) / heroes.length : 1
	return [
		...heroes.map((c) => ({ ...toChip(c), units: heroUnits })),
		...neutrals.map((c) => ({ ...toChip(c), units: 1 })),
	]
}

export default ColorPaletteBlock
