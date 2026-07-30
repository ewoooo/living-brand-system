import { ForwardStraightGenerator } from '@/components/studio/generate/forward-straight-generator'
import { StudioWorkspacePage } from '@/components/studio/studio-workspace'

export default function GenerateGraphicPage() {
	return (
		<StudioWorkspacePage
			title="그래픽 생성"
			description="그래픽 도구의 설정을 조정해 SVG 산출물을 만듭니다."
		>
			<ForwardStraightGenerator />
		</StudioWorkspacePage>
	)
}
