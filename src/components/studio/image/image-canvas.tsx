'use client'

import { Image as ImageIcon } from '@carbon/icons-react'
import { ImageGenerationResults } from '@/components/studio/image/image-generation-results'
import { Button } from '@/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'
import { Typography } from '@/components/ui/typography'
import { useImageStudio } from '@/features/image-studio/hooks/use-image-studio'

const EXAMPLE_PROMPTS = [
	'신제품을 위한 깨끗한 스튜디오 제품 이미지',
	'브랜드 캠페인을 위한 자연광 라이프스타일 이미지',
	'가이드 배경에 사용할 추상적인 자연 텍스처',
] as const

// 결과 캔버스: 컨텍스트의 결과를 그리고 선택만 되돌려 쓴다 — 컨트롤러를 모른다.
export function ImageCanvas() {
	const { prompt, generation, results } = useImageStudio()

	if (!generation.busy && !results.result) {
		return <EmptyCanvas onSelectExample={prompt.setValue} />
	}

	return (
		<ImageGenerationResults
			loading={generation.busy}
			onSelect={results.select}
			requested={results.requested}
			result={results.result}
			selected={results.selected}
		/>
	)
}

function EmptyCanvas({ onSelectExample }: { onSelectExample: (prompt: string) => void }) {
	return (
		<Empty className="h-full border-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<ImageIcon aria-hidden />
				</EmptyMedia>
				<EmptyTitle>브랜드 이미지를 생성하세요</EmptyTitle>
				<EmptyDescription>
					왼쪽 컨트롤러에 프롬프트를 입력하거나 예시로 시작할 수 있습니다.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="max-w-2xl">
				<Typography size="xs" weight="medium">
					예시로 시작하기
				</Typography>
				<div className="grid w-full gap-2 md:grid-cols-3">
					{EXAMPLE_PROMPTS.map((example) => (
						<Button
							key={example}
							type="button"
							variant="muted"
							className="h-auto min-h-16 justify-start whitespace-normal px-3 py-3 text-left"
							onClick={() => onSelectExample(example)}
						>
							{example}
						</Button>
					))}
				</div>
			</EmptyContent>
		</Empty>
	)
}
