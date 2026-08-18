'use client'

import { Upload } from '@carbon/icons-react'
import { type DragEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import type { CheckImage } from '@/features/asset-check/types'
import { CHECK_IMAGE_ACCEPT } from '@/features/asset-check/utils/image-format'
import { useFileInput } from '@/hooks/use-file-input'

/**
 * 퍼널 ① — 업로드·미리보기 캐러셀.
 * in : 컨텍스트 { images: CheckImage[], selectedId, select, addFiles }
 * out: addFiles(FileList) — 지원 타입(PNG/JPEG/WebP)만 CheckImage(idle)로 변환, 최신이 앞
 *      캐러셀 스와이프 → select(image.id)  (선택과 스크롤 양방향 동기화)
 * 렌더에 쓰는 필드: image.url(objectURL), image.name
 * previewSize: 표시 크기(%)만 줄인다 — 검수 요청은 원본 파일을 그대로 보낸다.
 */
export function ImageUploadCarousel({ previewSize }: { previewSize: number }) {
	const { images, selectedId, select, addFiles } = useCheckImages()
	const fileInput = useFileInput()
	const [carouselApi, setCarouselApi] = useState<CarouselApi>()
	const selectStateRef = useRef({ images, select })
	selectStateRef.current = { images, select }

	useEffect(() => {
		if (!carouselApi) return
		const api = carouselApi
		function handleSelect() {
			const { images, select } = selectStateRef.current
			const image = images[api.selectedScrollSnap()]
			if (image) select(image.id)
		}
		api.on('select', handleSelect)
		return () => {
			api.off('select', handleSelect)
		}
	}, [carouselApi])

	useEffect(() => {
		if (!carouselApi || !selectedId) return
		const index = images.findIndex((image) => image.id === selectedId)
		if (index >= 0) carouselApi.scrollTo(index)
	}, [carouselApi, images, selectedId])

	function handleDrop(event: DragEvent<HTMLElement>) {
		event.preventDefault()
		addFiles(event.dataTransfer.files)
	}

	return (
		<section
			data-slot="image-upload-carousel"
			aria-label="이미지 업로드 및 미리보기"
			className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
			onDragOver={(event) => event.preventDefault()}
			onDrop={handleDrop}
		>
			<Button
				type="button"
				variant="outline"
				size="icon-lg"
				className="absolute top-4 left-4 z-10"
				aria-label="검수할 이미지 업로드"
				onClick={fileInput.open}
			>
				<Upload data-icon="inline-start" />
			</Button>
			<input
				ref={fileInput.ref}
				type="file"
				accept={CHECK_IMAGE_ACCEPT}
				multiple
				hidden
				aria-label="검수할 이미지 업로드"
				onChange={(event) => {
					if (event.target.files) addFiles(event.target.files)
					fileInput.reset()
				}}
			/>

			{images.length === 0 ? null : (
				<CheckCarouselActive
					images={images}
					previewSize={previewSize}
					setCarouselApi={setCarouselApi}
				/>
			)}
		</section>
	)
}

function CheckCarouselActive({
	images,
	previewSize,
	setCarouselApi,
}: {
	images: CheckImage[]
	previewSize: number
	setCarouselApi: (api: CarouselApi) => void
}) {
	return (
		<Carousel setApi={setCarouselApi} className="w-full">
			<CarouselContent>
				{images.map((image) => (
					<CarouselItem key={image.id}>
						<div className="flex h-120 items-center justify-center">
							{/* 크기는 transform이 낸다 — 레이아웃 속성으로 줄이면 캐러셀 스냅 계산이
							    매 프레임 다시 돌아 트랜지션이 끊긴다(템플릿·그래픽 캔버스와 같은 방식). */}
							{/* biome-ignore lint/performance/noImgElement: 브라우저 object URL 미리보기 */}
							<img
								src={image.url}
								alt={image.name}
								style={{ transform: `scale(${previewSize / 100})` }}
								className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out motion-reduce:transition-none"
							/>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className="left-4" />
			<CarouselNext className="right-4" />
		</Carousel>
	)
}
