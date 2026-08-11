import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { forwardStraightGraphicConfig } from '@/features/graphic-studio/graphic-studio-runtime'

export default function GenerateGraphicPage() {
	return (
		<StudioWorkspacePage
			title="그래픽 생성"
			description="그래픽 도구의 설정을 조정해 SVG 산출물을 만듭니다."
		>
			<GraphicGenerator config={forwardStraightGraphicConfig} />
		</StudioWorkspacePage>
	)
}
