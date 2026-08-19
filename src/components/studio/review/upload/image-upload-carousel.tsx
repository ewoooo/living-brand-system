'use client'

import { type DragEvent, useEffect, useRef, useState } from 'react'
import type { PreviewSize } from '@/components/studio/shared/fit-preview-size'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import type { CheckImage } from '@/features/asset-check/types'

/**
 * 퍼널 ① — 업로드·미리보기 캐러셀.
 * in : 컨텍스트 { images: CheckImage[], selectedId, select, addFiles }
 * out: addFiles(FileList) — 드롭한 파일만 받는다(파일 선택 버튼은 없다), 최신이 앞
 *      캐러셀 스와이프 → select(image.id)  (선택과 스크롤 양방향 동기화)
 *      좌우 이동 버튼은 캔버스에 두지 않는다 — 페이지 이동은 하단 컨트롤 바가 갖는다.
 * 렌더에 쓰는 필드: image.url(objectURL), image.name
 * previewSize: 표시 크기(%)만 줄인다 — 검수 요청은 원본 파일을 그대로 보낸다.
 *
 * 크기 계약은 Template·Graphic 캔버스와 같다: 스테이지를 실측해 가용 영역을 구하고,
 * 100%가 그 영역을 채우는 크기가 되며, 슬라이더는 그 위에 배율을 곱한다.
 * 🔴 슬라이더 게이팅은 두 캔버스와 다르게 `lg:`를 걸지 않는다 — 바가 좁은 화면에서도 보이므로
 *    게이팅하면 보이는 컨트롤이 아무 일도 하지 않게 된다.
 */
export function ImageUploadCarousel({ previewSize }: { previewSize: number }) {
	const { images, selectedId, select, addFiles } = useCheckImages()
	const [carouselApi, setCarouselApi] = useState<CarouselApi>()
	const selectStateRef = useRef({ images, select })
	selectStateRef.current = { images, select }
	const stageRef = useRef<HTMLElement>(null)
	// 캐러셀 트랙(embla viewport)은 높이를 물려주지 않는다 — 슬라이드 상자 높이는 실측값으로 준다.
	const [stageHeight, setStageHeight] = useState(0)

	useEffect(() => {
		const stage = stageRef.current
		if (!stage) return
		const resize = (bounds: PreviewSize) => {
			if (bounds.height > 0) setStageHeight(bounds.height)
		}
		const observer = new ResizeObserver(([entry]) => {
			if (entry) resize(entry.contentRect)
		})
		resize({ width: stage.clientWidth, height: stage.clientHeight })
		observer.observe(stage)
		return () => observer.disconnect()
	}, [])

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
			ref={stageRef}
			data-slot="image-upload-carousel"
			aria-label="이미지 업로드 및 미리보기"
			className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-background"
			onDragOver={(event) => event.preventDefault()}
			onDrop={handleDrop}
		>
			{images.length === 0 ? null : (
				<CheckCarouselActive
					images={images}
					previewSize={previewSize}
					stageHeight={stageHeight}
					setCarouselApi={setCarouselApi}
				/>
			)}
		</section>
	)
}

function CheckCarouselActive({
	images,
	previewSize,
	stageHeight,
	setCarouselApi,
}: {
	images: CheckImage[]
	previewSize: number
	stageHeight: number
	setCarouselApi: (api: CarouselApi) => void
}) {
	return (
		<Carousel setApi={setCarouselApi} className="w-full">
			<CarouselContent>
				{images.map((image) => (
					<CarouselItem key={image.id}>
						<div
							className="flex items-center justify-center"
							style={{ height: stageHeight }}
						>
							{/* 비율 유지 축소는 object-contain이 낸다 — <img>에는 fitPreviewSize가 하는 계산을
							    브라우저가 그대로 해주고, naturalWidth를 기다리는 load 경합도 없앤다. */}
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
		</Carousel>
	)
}
