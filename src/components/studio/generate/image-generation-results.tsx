'use client'

import { Button } from '@/components/ui/button'
import type { ImageGenerationResult } from '@/features/generate-image/services/generate-image.client'
import { cn } from '@/lib/utils'
import { ImageCameraPresets } from './image-camera-presets'

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5']

export function ImageGenerationResults({
	loading,
	onSelect,
	requested,
	result,
	selected,
}: {
	loading: boolean
	onSelect: (index: number) => void
	requested: number
	result: ImageGenerationResult | null
	selected: number | null
}) {
	const images = result?.images ?? []
	const generatedImages = result?.generatedImages ?? []

	return (
		<div className="flex h-full min-h-0 flex-col" aria-live="polite" aria-busy={loading}>
			{loading && <ImageGenerationSkeleton count={requested} />}

			{!loading && images.length > 0 && result && (
				<div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
					<div className="flex flex-wrap items-center gap-3">
						<Button
							onClick={() =>
								selected !== null && downloadImage(images[selected], selected)
							}
							disabled={selected === null}
						>
							선택한 이미지 다운로드
						</Button>
						<span className="font-body text-sm font-normal text-muted-foreground">
							{selected === null
								? '이미지를 클릭해 선택하세요'
								: `${selected + 1}번 선택됨`}
						</span>
					</div>

					{images.length < requested && (
						<p className="font-body text-sm font-normal text-muted-foreground">
							요청 {requested}장 중 {images.length}장 생성됨 (일부는 무료 서버
							지연으로 실패)
						</p>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{images.map((src, index) => (
							<div key={src} className="flex flex-col gap-1">
								<button
									type="button"
									onClick={() => onSelect(index)}
									aria-pressed={selected === index}
									className={cn(
										'overflow-hidden rounded-md border-2 transition-colors',
										selected === index
											? 'border-primary'
											: 'border-border hover:border-ring',
									)}
								>
									{/* biome-ignore lint/performance/noImgElement: 미리보기, 최적화 불필요 */}
									<img
										src={src}
										alt={`생성 결과 ${index + 1}`}
										className="w-full"
									/>
								</button>
								<a
									href={src}
									target="_blank"
									rel="noreferrer"
									className="font-body text-sm font-normal text-muted-foreground underline"
								>
									원본 보기
								</a>
							</div>
						))}
					</div>

					<div className="font-body text-sm font-normal text-muted-foreground">
						{result.profileName ? `적용된 프로파일: ${result.profileName}` : null}
						<details className="mt-1">
							<summary className="cursor-pointer">생성 프롬프트 보기</summary>
							<p className="mt-1 whitespace-pre-wrap font-body text-xs font-normal">
								{result.prompt}
							</p>
						</details>
					</div>

					{selected !== null && result.profileId && generatedImages[selected] ? (
						<ImageCameraPresets
							key={`${result.profileId}:${selected}:${images[selected]}`}
							basePrompt={result.prompt}
							generatedImageId={generatedImages[selected].id}
							profileId={result.profileId}
							seedImage={images[selected]}
						/>
					) : (
						<p className="font-body text-sm font-normal text-muted-foreground">
							이미지를 선택하면 카메라 시점을 조정할 수 있습니다.
						</p>
					)}
				</div>
			)}
		</div>
	)
}

function ImageGenerationSkeleton({ count }: { count: number }) {
	return (
		<div className="flex flex-col gap-3">
			<p className="font-body text-sm font-normal text-muted-foreground">
				생성 중… 무료 서버라 최대 1~2분 걸릴 수 있어요.
			</p>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				{SKELETON_KEYS.slice(0, count).map((key) => (
					<div key={key} className="aspect-[3/4] animate-pulse rounded-md bg-muted" />
				))}
			</div>
		</div>
	)
}

/** 생성 이미지 URL 또는 data URI를 파일로 저장한다. */
function downloadImage(src: string, index: number) {
	const ext = src.startsWith('data:image/')
		? src.slice(11, src.indexOf(';')).replace('jpeg', 'jpg')
		: new URL(src, window.location.href).pathname.split('.').pop() || 'png'
	const anchor = document.createElement('a')
	anchor.href = src
	anchor.download = `essenherb-image-${index + 1}.${ext}`
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
}
