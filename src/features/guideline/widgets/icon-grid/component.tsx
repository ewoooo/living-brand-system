import config from '@payload-config'
import { getPayload } from 'payload'
import { type IconGridItem, IconGridView } from './view'

// 위젯(서버): brand-icons를 조회해 IconGridView(클라 인터랙션)에 순수 props 주입.
// 인스턴스 입력 없이 자족 렌더 — 프레임·제목은 컨테이너 Block이 소유하므로 위젯은 시각만 그린다.
//
// 🔴 색 조합은 옛 정적 매핑(ICON_COLORWAY)을 쓰지 않는다. 그 표는 essenherb 아이콘 파일명 →
//    essenherb 색 이름이라 HD에서는 한 칸도 맞지 않아 위젯과 함께 버렸다.
// ponytail: 대신 팔레트를 순서대로 돌려 배정한다. 대비(contrast) 기반 조합 알고리즘이 아니라
//    자리를 채우는 수준이고, HD 아이콘이 실제로 들어오면 그때 제대로 만든다.
const DEFAULT = { colored: false, heightPct: 100, svgPct: 70, offsetPct: 0 }

export async function IconGridWidget() {
	const payload = await getPayload({ config })
	const [iconsRes, colorsRes] = await Promise.all([
		payload.find({ collection: 'brand-icons', sort: 'createdAt', limit: 200, depth: 0 }),
		payload.find({ collection: 'brand-colors', limit: 200, depth: 0 }),
	])

	const palette = colorsRes.docs.flatMap((color) => (color.hex ? [color.hex] : []))

	const items: IconGridItem[] = iconsRes.docs.map((icon, index) => ({
		id: icon.id,
		n: index + 1,
		name: icon.name,
		group: icon.group ?? '',
		src: icon.url ?? `/api/brand-icons/file/${icon.filename}`,
		ratio: icon.width && icon.height ? `${icon.width} / ${icon.height}` : '1 / 1',
		bgHex: palette.length ? palette[index % palette.length] : undefined,
		fgHex: palette.length ? palette[(index + 1) % palette.length] : undefined,
	}))

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
