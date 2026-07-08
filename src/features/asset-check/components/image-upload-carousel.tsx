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
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import { ImageCheckControls } from '@/features/asset-check/components/image-check-controls'
import type { CheckImage } from '@/features/asset-check/types'
import { useFileInput } from '@/hooks/use-file-input'

export function ImageUploadCarousel() {
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
			aria-label="이미지 업로드 및 미리보기"
			className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-400/10"
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
				accept="image/*"
				multiple
				hidden
				aria-label="검수할 이미지 업로드"
				onChange={(event) => {
					if (event.target.files) addFiles(event.target.files)
					fileInput.reset()
				}}
			/>

			{images.length === 0 ? (
				<CheckCarouselEmpty />
			) : (
				<CheckCarouselActive images={images} setCarouselApi={setCarouselApi} />
			)}
			<ImageCheckControls />
		</section>
	)
}

function CheckCarouselEmpty() {
	return (
		<div className="flex flex-col items-center gap-2 px-6 text-center text-neutral-300">
			<p className="font-medium text-sm">이미지를 드래그해서 업로드하세요</p>
			<p className="opacity-60 text-xs">좌상단 업로드 버튼으로도 추가할 수 있습니다.</p>
		</div>
	)
}

function CheckCarouselActive({
	images,
	setCarouselApi,
}: {
	images: CheckImage[]
	setCarouselApi: (api: CarouselApi) => void
}) {
	return (
		<Carousel setApi={setCarouselApi} className="w-full">
			<CarouselContent>
				{images.map((image) => (
					<CarouselItem key={image.id}>
						<div className="flex h-72 items-center justify-center">
							{/* biome-ignore lint/performance/noImgElement: 브라우저 object URL 미리보기 */}
							<img
								src={image.url}
								alt={image.name}
								className="max-h-full max-w-full object-contain"
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
