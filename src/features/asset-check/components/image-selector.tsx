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
import { Separator } from '@/components/ui/separator'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import { CHECK_SCENARIOS } from '@/features/asset-check/scenarios'

export function ImageSelector() {
	const {
		images,
		selectedId,
		selected,
		select,
		addFiles,
		scenarioKey,
		setScenarioKey,
		runCheck,
	} = useCheckImages()
	const inputRef = useRef<HTMLInputElement>(null)
	const [carouselApi, setCarouselApi] = useState<CarouselApi>()

	useEffect(() => {
		if (!carouselApi) return
		const api = carouselApi
		function handleSelect() {
			const image = images[api.selectedScrollSnap()]
			if (image) select(image.id)
		}
		api.on('select', handleSelect)
		return () => {
			api.off('select', handleSelect)
		}
	}, [carouselApi, images, select])

	useEffect(() => {
		if (!carouselApi || !selectedId) return
		const index = images.findIndex((image) => image.id === selectedId)
		if (index >= 0) carouselApi.scrollTo(index)
	}, [carouselApi, images, selectedId])

	function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault()
		addFiles(event.dataTransfer.files)
	}

	return (
		<div className="sticky top-0 z-10 bg-background/95 pt-6 pb-4 backdrop-blur">
			<div className="rounded-lg border bg-card p-5 shadow-sm">
				<section
					aria-label="이미지 업로드 및 미리보기"
					className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background"
					onDragOver={(event) => event.preventDefault()}
					onDrop={handleDrop}
				>
					<Button
						type="button"
						variant="outline"
						size="icon-lg"
						className="absolute top-4 left-4"
						aria-label="검수할 이미지 업로드"
						onClick={() => inputRef.current?.click()}
					>
						<Upload data-icon="inline-start" />
					</Button>
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						multiple
						hidden
						aria-label="검수할 이미지 업로드"
						onChange={(event) => {
							if (event.target.files) addFiles(event.target.files)
							event.target.value = ''
						}}
					/>

					{images.length === 0 ? (
						<div className="flex flex-col items-center gap-2 px-6 text-center">
							<p className="font-medium text-sm">이미지를 드래그해서 업로드</p>
							<p className="text-muted-foreground text-xs">
								좌상단 업로드 버튼으로도 추가할 수 있습니다.
							</p>
						</div>
					) : (
						<Carousel setApi={setCarouselApi} className="w-full px-12">
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
					)}
				</section>

				<Separator className="my-4" />

				<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
					<label className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground text-xs">시나리오</span>
						<select
							value={scenarioKey}
							disabled={selected?.status === '진행'}
							onChange={(event) => setScenarioKey(event.target.value)}
							className="h-8 rounded-md border bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
						>
							{CHECK_SCENARIOS.map((scenario) => (
								<option key={scenario.key} value={scenario.key}>
									{scenario.title}
								</option>
							))}
						</select>
					</label>
					<Button
						type="button"
						size="sm"
						className="ml-auto"
						disabled={!selectedId || selected?.status === '진행'}
						onClick={runCheck}
					>
						{selected?.status === '진행' ? '검수 중…' : '검수'}
					</Button>
				</div>
			</div>
		</div>
	)
}
