'use client'

import { Image as ImageIcon } from '@carbon/icons-react'
import { ImageCanvas } from '@/components/studio/image/image-canvas'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { ImageSidebar } from '@/components/studio/sidebar/image-sidebar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { ImageStudioConfig } from '@/features/image-generation/domain/image-studio-config'
import { useImageStudio } from '@/features/image-generation/hooks/use-image-studio'
import { toOpenAIImageSize } from '@/features/image-generation/image-size'
import { ImageStudioProvider } from '@/features/image-generation/providers/image-studio-provider'
import { createImageArtifacts } from '@/features/image-generation/runtime/image-artifact.client'
import { useImageExport } from '@/features/studio-export/hooks/use-image-export'

// 생성 표면: 편집 세션 소유는 ImageStudioProvider, 조작은 컨트롤러, 결과는 캔버스가 그린다.
export function ImageGenerator({ config }: { config: ImageStudioConfig | null }) {
	// 발행된 프로파일이 없으면 열 컨트롤이 없다 — 계약 없이 컨트롤러를 그리지 않는다.
	if (!config) {
		return (
			<Empty className="h-full border-0">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ImageIcon aria-hidden />
					</EmptyMedia>
					<EmptyTitle>발행된 이미지 프로파일이 없습니다</EmptyTitle>
					<EmptyDescription>
						관리자가 이미지 프로파일을 발행하면 생성을 시작할 수 있습니다.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<ImageStudioProvider config={config}>
			<ImageWorkspace />
		</ImageStudioProvider>
	)
}

function ImageWorkspace() {
	const { profiles, results } = useImageStudio()
	const items = results.items
	const resultConfig = profiles.options.find((candidate) => candidate.id === items[0]?.profileId)
	const exportSize = results.output
		? toOpenAIImageSize(results.output.aspectRatio, results.output.imageSize)
				.split('x')
				.map(Number)
		: null
	const download = useImageExport({
		artifacts:
			items.length > 0
				? createImageArtifacts({
						images: items.map((item) => item.src),
						color: results.color,
					})
				: null,
		capability: resultConfig?.output ?? { formats: [], original: false },
		selected: results.selected,
		size: exportSize ? { width: exportSize[0], height: exportSize[1] } : null,
	})

	return (
		<StudioWorkspace sidebar={<ImageSidebar download={download} />}>
			<ImageCanvas />
		</StudioWorkspace>
	)
}
