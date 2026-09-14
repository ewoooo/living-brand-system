import { notFound } from 'next/navigation'
import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

// 렌더링: 매 요청. 권한과 발행된 프로파일을 읽으므로 캐시하지 않는다(docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

/**
 * Graph Studio — 가이드라인 B.11 INFOGRAPHIC의 표현을 만든다.
 * Graphic과 같은 파이프라인을 쓰고 서는 자리만 다르다(`GRAPH_RUNTIME_IDS`).
 */
export default async function GenerateGraphPage() {
	const { user } = await requireUser(routes.studio.graph)
	const [config] = await listGraphicStudioConfigs(user, 'graph')
	if (!config) notFound()

	return (
		<StudioWorkspacePage
			title="인포그래픽 생성"
			description="인포그래픽 표현을 고르고 결과를 미리 봅니다."
			hideHeading
		>
			<GraphicGenerator config={config} studioKind="graph" />
		</StudioWorkspacePage>
	)
}
