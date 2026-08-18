'use client'

import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { TemplateSidebar } from '@/components/studio/sidebar/template-sidebar'
import { useTemplateExport } from '@/features/studio-export/hooks/use-template-export'
import type {
	PublishedTemplateView,
	TemplateStudioConfig,
} from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import { TemplateStudioProvider } from '@/features/template-customization/providers/template-studio-provider'
import { TemplateCanvas } from './template-canvas'

type TemplateGeneratorProps = {
	config: TemplateStudioConfig
	/** 식별 카드의 부제 — 교체 후보 목록은 자산 브라우저가 열릴 때 따로 가져온다. */
	categoryTitle: string | null
	template: PublishedTemplateView
}

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드,
 * imageInput이 달린 프레임 이미지 슬롯)을 편집해
 * 미리보기의 Raster Artifact를 공통 Export Layer가 PNG·JPEG·TIFF·PDF·MP4로 변환한다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 사이드바(컨트롤러)와 캔버스(작업 공간)는 서로를 모른다 — 편집 세션 상태는
 * TemplateStudioProvider(features)가 단일 소유하고 둘 다 컨텍스트로만 소통한다.
 */
export function TemplateGenerator({ config, categoryTitle, template }: TemplateGeneratorProps) {
	return (
		<TemplateStudioProvider config={config} template={template} categoryTitle={categoryTitle}>
			<TemplateWorkspace template={template} />
		</TemplateStudioProvider>
	)
}

function TemplateWorkspace({ template }: { template: PublishedTemplateView }) {
	const { canvas, config, execution } = useTemplateStudio()
	const exporting = useTemplateExport({
		artifact: canvas.artifact,
		videoArtifact: canvas.videoArtifact,
		capability: config.output,
		metadata: {
			fileName: template.name,
			width: config.template.exportOption.canvas.width,
			height: config.template.exportOption.canvas.height,
			controller: {
				groups: config.controller.groups,
				values: execution.controllerValues,
			},
		},
	})

	return (
		<StudioWorkspace sidebar={<TemplateSidebar exporting={exporting} />}>
			<TemplateCanvas />
		</StudioWorkspace>
	)
}
