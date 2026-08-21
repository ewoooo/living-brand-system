import config from '@payload-config'
import { getPayload } from 'payload'
import { MONO_COLORS, SYMBOL_CONTOURS, WORDMARK_COLOR_NAME } from './rules'
import { type CiLockupFixed, CiLockupView } from './view'

// 위젯(서버): 색 값만 brand-colors에서 꺼내 뷰에 넘긴다. 고르는 것은 화면이 하고 값의 정본은 컬렉션이다.
//
// 🔴 hex를 코드에 박지 않는다 — 브랜드 색이 바뀌면 컬렉션만 고치면 되게 이름으로 찾는다.
// 🔴 팔레트를 통째로 넘기지 않는다. 색상 표현 3종이 쓰는 색은 정해져 있고(심볼 3색·워드마크 색·
//    단색형 BLACK/WHITE), 임의 색을 열면 그 색에는 규정이 없다.

/** 이 위젯이 쓰는 색 이름 전부. 조회와 타입이 같은 목록을 쓰게 한 곳에 모은다. */
const COLOR_NAMES = [
	WORDMARK_COLOR_NAME,
	...MONO_COLORS,
	...SYMBOL_CONTOURS.map((c) => c.colorName),
]

export async function CiLockupWidget({ fixed }: { fixed?: CiLockupFixed }) {
	return <CiLockupView colors={await brandColors()} fixed={fixed} />
}

/**
 * 색을 못 찾아도 판이 서야 한다 — 위젯 하나가 페이지 전체를 죽이지 않게 한다.
 *
 * 🔑 export인 이유: 같은 락업을 다른 판에 얹는 위젯(`ci-lockup-hero`)이 같은 색 목록을 써야 한다.
 *    목록을 두 곳에 적으면 색이 하나 늘 때 한쪽만 고쳐진다.
 */
export async function brandColors(): Promise<Record<string, string>> {
	try {
		const payload = await getPayload({ config })
		const { docs } = await payload.find({
			collection: 'brand-colors',
			where: { name: { in: COLOR_NAMES } },
			depth: 0,
			limit: 20,
			overrideAccess: true,
		})
		return Object.fromEntries(docs.flatMap((d) => (d.name && d.hex ? [[d.name, d.hex]] : [])))
	} catch {
		return {}
	}
}

export default CiLockupWidget
