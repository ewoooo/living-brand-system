import { notFound } from 'next/navigation'
import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listGraphicStudioConfigs } from '@/features/graphic-studio/services/list-graphic-studio-configs.service'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GenerateGraphicPage() {
	const { user } = await authenticateRequest()
	if (!user) notFound()
	const [config] = await listGraphicStudioConfigs(user)
	if (!config) notFound()

	return (
		<StudioWorkspacePage
			title="그래픽 생성"
			description="그래픽 도구의 설정을 조정하고 결과를 미리 봅니다."
		>
			<GraphicGenerator config={config} />
		</StudioWorkspacePage>
	)
}
