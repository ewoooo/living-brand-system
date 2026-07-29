import config from '@payload-config'
import { getPayload } from 'payload'
import {
	type LogoGroupItem,
	type LogoGroupTopic,
	LogoGroupView,
} from '@/features/guideline/blocks/logo-group-viewer/view'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/logo-group-viewer) 통째 삭제.
//
// 위젯(서버): application-images 대표 항목(최대 3)을 로고 그룹으로 조립해 LogoGroupView(클라 인터랙션)에 순수 props 주입.
// author 인스턴스(logos/topics/title) 없이 자족 렌더 — 프레임/헤더/설명 산문은 컨테이너 Block이 소유하므로 위젯은 시각/인터랙션만.
// 로고 그룹은 컬렉션이 아닌 author config에서 오므로 여기서는 컬렉션 대표 이미지로 대체하고 임계값·토픽은 블록 기본값을 하드코딩한다.

// 토픽·임계값은 블록 default 그대로. 설명 산문은 컨테이너 Block 소유이므로 위젯에서는 생략(description=null).
const DEFAULT_TOPICS: LogoGroupTopic[] = [
	{ id: 'minSize', kind: 'minSize', label: 'Minimum Size', description: null },
	{ id: 'clearSpace', kind: 'clearSpace', label: 'Clear Space', description: null },
	{
		id: 'registeredMark',
		kind: 'registeredMark',
		label: 'Registered Trademark',
		description: null,
	},
]

export async function LogoGroupViewerWidget() {
	const payload = await getPayload({ config })
	const { docs } = await payload.find({
		collection: 'application-images',
		limit: 3,
		depth: 0,
		sort: 'createdAt',
	})

	const logos: LogoGroupItem[] = docs
		.map((doc) => ({
			id: String(doc.id),
			label: doc.name ?? null,
			logo: doc.url ?? (doc.filename ? `/api/application-images/file/${doc.filename}` : ''),
			registeredMark: null,
			clearSpaceGuide: null,
			logoRealHeightPx: null,
			minSizePx: 20,
			registeredMinPx: 45,
		}))
		.filter((item) => item.logo)

	if (logos.length === 0) return null

	return <LogoGroupView logos={logos} topics={DEFAULT_TOPICS} />
}

export default LogoGroupViewerWidget
