import { notFound } from 'next/navigation'
import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { requireUser } from '@/lib/request-auth'
import { getStudioGraphRoute } from '@/lib/routes'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다(docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

/** 세그먼트는 runtime id다 — 근거는 `/studio/graphic/[profileSlug]`가 갖는다. */
export default async function GenerateGraphProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	const { user } = await requireUser(getStudioGraphRoute(profileSlug))

	const configs = await listGraphicStudioConfigs(user, 'graph')
	const config = configs.find((item) => item.id === profileSlug)

	if (!config) notFound()

	return (
		<StudioWorkspacePage
			title={config.name}
			description="인포그래픽 표현을 고르고 결과를 미리 봅니다."
			hideHeading
		>
			<GraphicGenerator config={config} studioKind="graph" />
		</StudioWorkspacePage>
	)
}
