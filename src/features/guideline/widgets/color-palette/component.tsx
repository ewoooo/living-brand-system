import config from '@payload-config'
import { getPayload } from 'payload'
import { ColorSwatch } from '@/features/guideline/blocks/color-palette/color-swatch'
import {
	type PaletteChip,
	PaletteGrid,
	type PaletteMainChip,
} from '@/features/guideline/blocks/color-palette/palette-grid'
import type { BrandColor } from '@/payload-types'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/color-palette) 통째 삭제.
//
// 위젯(서버): brand-colors 전체를 조회해 전체 팔레트를 렌더한다(author 선택 없음, 읽기 전용).
// 프레임/레이아웃은 컨테이너 Block이 소유하므로 위젯은 그리드만 렌더. 뷰(PaletteGrid/ColorSwatch)는 원본 재사용.

const toChip = (c: BrandColor): PaletteChip => ({
	id: c.id,
	name: c.name,
	hex: c.hex,
	pantone: c.pantone,
})

// colorGroup별로 묶는다. 계열 등장 순서는 첫 등장, 행 내부는 tone 오름차순.
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

// main 열: isMain 색. hero(tone 있음) 먼저, neutral(tone 없음) 뒤. hero가 남은 높이를 균등 분할.
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

export async function ColorPaletteWidget() {
	const payload = await getPayload({ config })
	const { docs: colors } = await payload.find({
		collection: 'brand-colors',
		limit: 200,
		depth: 0,
		sort: 'createdAt',
	})
	const families = groupFamilies(colors)

	return families.length > 0 ? (
		<PaletteGrid main={buildMain(colors, families.length)} families={families} />
	) : (
		<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
			{colors.map((color) => (
				<ColorSwatch key={color.id} color={color} />
			))}
		</div>
	)
}

export default ColorPaletteWidget
