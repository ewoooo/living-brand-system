import config from '@payload-config'
import { getPayload } from 'payload'
import { ClearSpaceView } from '@/features/guideline/blocks/stem-clear-space/view'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/stem-clear-space) 통째 삭제.
//
// 위젯(서버): brand-logos 대표 항목을 조회해 클리어스페이스 뷰어에 순수 props 주입(author 선택 없음, 읽기 전용).
// 프레임/텍스트는 컨테이너 Block이 소유하므로 위젯은 시각 뷰(ClearSpaceView)만 렌더. 뷰는 원본 재사용.
// 측정값(stemRatio·stemX)·배수는 블록 스키마 defaultValue를 그대로 사용.
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
