'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { ImageResultImage } from '@/features/image-generation/contexts/image-studio-context'
import type { ImageAspectRatio } from '@/features/image-generation/image-size'
import {
	type ImageColorAdjustment,
	imageColorizeStyle,
} from '@/features/image-generation/runtime/image-colorize'
import { cn } from '@/lib/utils'

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5']

type ImageGenerationResultsProps = {
	aspectRatio: ImageAspectRatio
	/** 색 조정 값 — 있으면 결과 전부에 얹는다(한 장만 물들이지 않는다). null이면 원본만 보인다. */
	color: ImageColorAdjustment | null
	/** 그리드가 그리는 순서 그대로 — 참조가 있으면 referenceIndex 자리가 참조다. */
	items: readonly ImageResultImage[]
	loading: boolean
	onSelect: (index: number) => void
	referenceIndex: number | null
	requested: number
	selected: number | null
}

export function ImageGenerationResults({
	aspectRatio,
	color,
	items,
	loading,
	onSelect,
	referenceIndex,
	requested,
	selected,
}: ImageGenerationResultsProps) {
	// 참조는 이번 요청이 만든 장수에 들어가지 않는다 — 안내는 결과만 센다.
	const generatedCount = items.length - (referenceIndex === null ? 0 : 1)

	return (
		<div
			data-slot="image-generation-results"
			className="flex h-full min-h-0 flex-col"
			aria-live="polite"
			aria-busy={loading}
		>
			{loading && <ImageGenerationSkeleton aspectRatio={aspectRatio} count={requested} />}

			{!loading && items.length > 0 && (
				<div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
					{/* 선택은 컨트롤러의 카메라 섹션과 저장 CTA를 여는 입력이다 — 그래서 안내가 남는다. */}
					{selected === null && (
						<Typography as="p" size="sm" tone="muted">
							이미지를 클릭해 선택하면 시점 조정과 저장을 할 수 있어요
						</Typography>
					)}

					{generatedCount < requested && (
						<Typography size="sm" tone="muted">
							요청 {requested}장 중 {generatedCount}장 생성됨 (일부는 무료 서버
							지연으로 실패)
						</Typography>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{items.map((item, index) => {
							const isReference = index === referenceIndex
							const label = isReference
								? '참조 원본'
								: `생성 결과 ${index - (referenceIndex === null ? -1 : 0)}`

							return (
								<div key={item.src} className="flex flex-col gap-1">
									<button
										type="button"
										onClick={() => onSelect(index)}
										aria-pressed={selected === index}
										className={cn(
											'overflow-hidden rounded-md border-2 transition-colors',
											selected === index
												? 'border-primary'
												: isReference
													? 'border-foreground'
													: 'border-border hover:border-ring',
										)}
									>
										<ResultImage
											aspectRatio={aspectRatio}
											color={color}
											label={label}
											src={item.src}
										/>
									</button>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}

type ResultImageProps = {
	aspectRatio: ImageAspectRatio
	color: ImageColorAdjustment | null
	label: string
	src: string
}

/**
 * 결과 카드 한 장 — 색이 있으면 원본은 마스크로만 쓰이고(박스 크기를 유지하려 남겨둔다),
 * 저장과 같은 계산(imageColorizeStyle)이 만든 색 층이 그 위에 얹힌다.
 * 원본을 지우는 데 opacity를 쓴다 — visibility:hidden은 접근성 트리에서도 빼서
 * 이 카드를 감싼 선택 버튼의 유일한 접근 이름(alt)까지 사라진다.
 */
function ResultImage({ aspectRatio, color, label, src }: ResultImageProps) {
	const colorize = color ? imageColorizeStyle(src, color) : null

	return (
		<div
			data-slot="image-result"
			className="relative overflow-hidden"
			style={{ ...colorize?.base, aspectRatio: aspectRatio.replace(':', ' / ') }}
		>
			{/* biome-ignore lint/performance/noImgElement: 미리보기, 최적화 불필요 */}
			<img src={src} alt={label} className={cn('w-full', colorize && 'opacity-0')} />
			{colorize && (
				<div
					data-slot="image-colorize-overlay"
					aria-hidden
					className="absolute inset-0"
					style={colorize.overlay}
				/>
			)}
		</div>
	)
}

function ImageGenerationSkeleton({
	aspectRatio,
	count,
}: {
	aspectRatio: ImageAspectRatio
	count: number
}) {
	return (
		<div data-slot="image-generation-skeleton" className="flex flex-col gap-3">
			<Typography size="sm" tone="muted">
				생성 중… 무료 서버라 최대 1~2분 걸릴 수 있어요.
			</Typography>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				{SKELETON_KEYS.slice(0, count).map((key) => (
					<Skeleton key={key} style={{ aspectRatio: aspectRatio.replace(':', ' / ') }} />
				))}
			</div>
		</div>
	)
}
