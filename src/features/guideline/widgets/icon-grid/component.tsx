import config from '@payload-config'
import { getPayload } from 'payload'
import { ICON_COLORWAY } from '@/features/guideline/blocks/icon-grid/colorway'
import {
	type IconGridItem,
	IconGridView,
} from '@/features/guideline/blocks/icon-grid/icon-grid-view'

// 위젯(서버): brand-icons + 정적 colorway를 조립해 IconGridView(클라 인터랙션)에 순수 props 주입.
// author 인스턴스(title/config) 없이 자족 렌더 — 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각만.
// 조립 로직은 blocks/icon-grid/component.tsx와 동일. Phase 2에서 컨테이너화하며 정리.
const DEFAULT = { colored: false, heightPct: 100, svgPct: 70, offsetPct: 0 }

export async function IconGridWidget() {
	const payload = await getPayload({ config })
	const [iconsRes, colorsRes] = await Promise.all([
		payload.find({ collection: 'brand-icons', sort: 'createdAt', limit: 200, depth: 0 }),
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0 }),
	])

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
		<IconGridView
			items={items}
			colored={DEFAULT.colored}
			heightPct={DEFAULT.heightPct}
			svgPct={DEFAULT.svgPct}
			offsetPct={DEFAULT.offsetPct}
		/>
	)
}

export default IconGridWidget
