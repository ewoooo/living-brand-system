'use client'

import { useCallback, useState } from 'react'
import { GraphicCanvas } from '@/components/studio/graphic/graphic-canvas'
import { GraphicSidebar } from '@/components/studio/graphic/graphic-sidebar'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	GraphicStudioProvider,
	useGraphicStudio,
} from '@/features/graphic-generation/hooks/use-graphic-studio'
import type { GraphicRuntime } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { useGraphicExport } from '@/features/studio-export/hooks/use-graphic-export'

type GraphicGeneratorProps = {
	configs: GraphicStudioConfig[]
}

/** 가변 그래픽 Definition을 하나의 편집 세션·Controller·Canvas에 배선한다. */
export function GraphicGenerator({ configs }: GraphicGeneratorProps) {
	return (
		<GraphicStudioProvider configs={configs}>
			<GraphicWorkspace />
		</GraphicStudioProvider>
	)
}

function GraphicWorkspace() {
	const { config, controls } = useGraphicStudio()
	const [browserState, setBrowserState] = useState<{
		profileId: string
		artifacts: GraphicRuntime['artifacts']
		viewport: { width: number; height: number }
	} | null>(null)
	const browser = browserState?.profileId === config.id ? browserState : null
	const registerArtifacts = useCallback(
		(
			artifacts: GraphicRuntime['artifacts'] | null,
			viewport?: { width: number; height: number },
		) => {
			setBrowserState(
				artifacts && viewport ? { profileId: config.id, artifacts, viewport } : null,
			)
		},
		[config.id],
	)
	const { output } = useGraphicExport({
		artifacts: browser?.artifacts ?? null,
		config,
		values: controls.values,
		viewport: browser?.viewport ?? null,
	})

	return (
		<StudioWorkspace controller={<GraphicSidebar output={output} />}>
			<GraphicCanvas output={output} registerArtifacts={registerArtifacts} />
		</StudioWorkspace>
	)
}
