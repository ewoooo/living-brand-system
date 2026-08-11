import config from '@payload-config'
import { getPayload } from 'payload'
import { ClearSpaceView } from './view'

// 위젯(서버): brand-logos 대표 항목을 조회해 클리어스페이스 뷰어에 순수 props 주입(읽기 전용).
// 프레임·제목은 컨테이너 Block이 소유하므로 위젯은 시각 뷰(ClearSpaceView)만 렌더한다.
//
// 🔴 기준이 HD 규정과 다르다 — 이건 로고 획 두께(stem) 배수이고 HD는 심볼 높이 H 기준이다.
//    HD 규정을 그리는 것은 clearspace-viewer 위젯이고, 이쪽은 stem 측정 방식이 필요할 때 쓰는
//    비상용으로 남긴다(2026-08-10 사용자 판단). 기본값도 essenherb 로고 실측치라 HD에선 맞지 않는다.
const DEFAULT = { stemRatio: 0.025, stemX: 0.29, multiplier: 3 }

export async function StemClearSpaceWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'brand-logos',
		sort: 'createdAt',
		limit: 1,
		depth: 0,
	})
	const logo = docs[0]
	const src = logo
		? (logo.url ?? (logo.filename ? `/api/brand-logos/file/${logo.filename}` : null))
		: null

	if (!src) return null

	return (
		<ClearSpaceView
			logoSrc={src}
			stemRatio={DEFAULT.stemRatio}
			stemX={DEFAULT.stemX}
			multiplier={DEFAULT.multiplier}
		/>
	)
}

export default StemClearSpaceWidget
