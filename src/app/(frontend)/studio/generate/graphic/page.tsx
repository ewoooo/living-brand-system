import { notFound } from 'next/navigation'
import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { authenticateRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 권한과 발행된 Graphic Profile을 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

export default async function GenerateGraphicPage() {
	const { user } = await authenticateRequest()
	if (!user) notFound()
	const configs = await listGraphicStudioConfigs(user)
	if (!configs[0]) notFound()

	return (
		<StudioWorkspacePage
			title="그래픽 생성"
			description="그래픽 도구의 설정을 조정하고 결과를 미리 봅니다."
			hideHeading
		>
			<GraphicGenerator configs={configs} />
		</StudioWorkspacePage>
	)
}
