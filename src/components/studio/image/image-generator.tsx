'use client'

import { Image as ImageIcon } from '@carbon/icons-react'
import { ImageCanvas } from '@/components/studio/image/image-canvas'
import { ImageSidebar } from '@/components/studio/image/image-sidebar'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { ImageStudioConfig } from '@/features/image-generation/domain/image-studio-config'
import {
	ImageStudioProvider,
	useImageStudio,
} from '@/features/image-generation/hooks/use-image-studio'
import { useImageExport } from '@/features/studio-export/hooks/use-image-export'
import { createImageRasterArtifact } from '@/features/studio-export/services/export-image.client'

// 생성 표면: 편집 세션 소유는 ImageStudioProvider, 조작은 컨트롤러, 결과는 캔버스가 그린다.
export function ImageGenerator({
	configs,
	initialProfileId,
}: {
	configs: ImageStudioConfig[]
	initialProfileId?: number
}) {
	// 발행된 프로파일이 없으면 열 컨트롤이 없다 — 계약 없이 컨트롤러를 그리지 않는다.
	if (configs.length === 0) {
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
		<ImageStudioProvider configs={configs} initialProfileId={initialProfileId}>
			<ImageWorkspace />
		</ImageStudioProvider>
	)
}

function ImageWorkspace() {
	const { profiles, results } = useImageStudio()
	const result = results.result
	const resultConfig = profiles.options.find((candidate) => candidate.id === result?.profileId)
	const download = useImageExport({
		artifact: result
			? createImageRasterArtifact({ images: result.images, color: results.color })
			: null,
		capability: resultConfig?.output ?? { formats: [], original: false },
		selected: results.selected,
	})

	return (
		<StudioWorkspace controller={<ImageSidebar download={download} />}>
			<ImageCanvas />
		</StudioWorkspace>
	)
}
