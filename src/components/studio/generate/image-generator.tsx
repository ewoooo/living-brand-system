'use client'

import { Image as ImageIcon } from '@carbon/icons-react'
import { ImageCanvas } from '@/components/studio/generate/image-canvas'
import { ImageSidebar } from '@/components/studio/generate/image-sidebar'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ImageStudioProvider } from '@/features/image-studio/hooks/use-image-studio'
import type { ImageStudioConfig } from '@/features/image-studio/image-studio-config'

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
			<StudioWorkspace controller={<ImageSidebar />}>
				<ImageCanvas />
			</StudioWorkspace>
		</ImageStudioProvider>
	)
}
