'use client'

import { GraphicCanvas } from '@/components/studio/graphic/graphic-canvas'
import { GraphicSidebar } from '@/components/studio/graphic/graphic-sidebar'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { GraphicStudioProvider } from '@/features/graphic-generation/hooks/use-graphic-studio'

type GraphicGeneratorProps = {
	configs: GraphicStudioConfig[]
}

/** 가변 그래픽 Definition을 하나의 편집 세션·Controller·Canvas에 배선한다. */
export function GraphicGenerator({ configs }: GraphicGeneratorProps) {
	return (
		<GraphicStudioProvider configs={configs}>
			<StudioWorkspace controller={<GraphicSidebar />}>
				<GraphicCanvas />
			</StudioWorkspace>
		</GraphicStudioProvider>
	)
}
