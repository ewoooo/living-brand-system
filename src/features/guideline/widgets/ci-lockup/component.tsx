import config from '@payload-config'
import { getPayload } from 'payload'
import { STAGE_COLOR_NAME, WORDMARK_COLOR_NAME } from './rules'
import { CiLockupView } from './view'

// 위젯(서버): 색만 brand-colors에서 꺼내 뷰에 넘긴다.
// 🔴 색은 저작자가 고르는 값이 아니다 — 워드마크는 정본 락업의 색이고, 판 색은 규정이 정한다
//    (기본형 Full Color는 흰색·밝은 배경 전용, 01-specs C). 그래서 인스턴스 필드로 두지 않는다.
// 🔴 hex를 코드에 박지 않는다. 브랜드 색이 바뀌면 컬렉션만 고치면 되게 이름으로 찾는다.

export async function CiLockupWidget() {
	const colors = await brandColors()
	return (
		<CiLockupView
			wordmarkColor={colors[WORDMARK_COLOR_NAME] ?? 'currentColor'}
			stageColor={colors[STAGE_COLOR_NAME] ?? '#fff'}
		/>
	)
}

/** 색을 못 찾아도 판이 서야 한다 — 위젯 하나가 페이지 전체를 죽이지 않게 한다. */
async function brandColors(): Promise<Record<string, string>> {
	try {
		const payload = await getPayload({ config })
		const { docs } = await payload.find({
			collection: 'brand-colors',
			where: { name: { in: [WORDMARK_COLOR_NAME, STAGE_COLOR_NAME] } },
			depth: 0,
			limit: 10,
			overrideAccess: true,
		})
		return Object.fromEntries(docs.flatMap((d) => (d.name && d.hex ? [[d.name, d.hex]] : [])))
	} catch {
		return {}
	}
}

export default CiLockupWidget
