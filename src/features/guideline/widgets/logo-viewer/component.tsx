import config from '@payload-config'
import { getPayload } from 'payload'
import { LogoViewer, type LogoViewerTopic } from '@/features/guideline/blocks/logo-viewer/view'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/logo-viewer) 통째 삭제.
//
// 위젯(서버): brand-logos에서 대표 로고 1개를 뽑아 자족 렌더한다(author 인스턴스 없음, 읽기 전용).
// 프레임/텍스트(GuidelineHeader/Description, BlockFrame)는 컨테이너 Block이 소유하므로 위젯은 뷰어만.
// 뷰(LogoViewer)는 원본 재사용. 오버레이(®·클리어스페이스)는 author 에셋이라 여기선 없음 → null로 우아하게 강등.

// blocks/logo-viewer/component.tsx의 DEFAULT_LABEL과 동일. author config 없이 세 topic을 기본값으로 하드코딩.
const TOPICS: LogoViewerTopic[] = [
	{ id: 'minSize', kind: 'minSize', label: 'Minimum Size', description: null },
	{ id: 'clearSpace', kind: 'clearSpace', label: 'Clear Space', description: null },
	{
		id: 'registeredMark',
		kind: 'registeredMark',
		label: 'Registered Trademark',
		description: null,
	},
]

export async function LogoViewerWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'brand-logos',
		limit: 1,
		depth: 0,
		sort: 'createdAt',
	})
	const doc = docs[0]
	if (!doc) return null
	const logo = doc.url ?? (doc.filename ? `/api/brand-logos/file/${doc.filename}` : null)
	if (!logo) return null

	return (
		<LogoViewer
			logo={logo}
			registeredMark={null}
			clearSpaceGuide={null}
			minSizePx={20}
			registeredMinPx={45}
			topics={TOPICS}
		/>
	)
}

export default LogoViewerWidget
