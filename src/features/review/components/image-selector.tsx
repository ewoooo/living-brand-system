'use client'

import { useRef } from 'react'
import { useReviewImages } from '@/features/review/image-context'

export function ImageSelector() {
	const { images, selectedId, selected, select, addFiles } = useReviewImages()
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className="sticky top-14 z-10 flex h-56 flex-col justify-center border-neutral-200 border-b bg-background/95 px-8 backdrop-blur dark:border-neutral-800">
			<div className="flex items-center gap-4 overflow-x-auto">
				{/* 업로드 입력 */}
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-neutral-300 border-dashed text-muted-foreground text-xs transition-colors hover:bg-neutral-500/5 hover:text-foreground dark:border-neutral-700"
				>
					<span className="text-lg leading-none">+</span>
					업로드
				</button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					hidden
					onChange={(event) => {
						if (event.target.files) addFiles(event.target.files)
						event.target.value = ''
					}}
				/>

				{/* 검수 대상 스트립 — 최신 좌측, 선택은 크게 */}
				{images.length === 0 ? (
					<p className="text-muted-foreground text-sm">검수할 이미지를 업로드하세요.</p>
				) : (
					images.map((image) => {
						const active = image.id === selectedId
						return (
							<button
								key={image.id}
								type="button"
								onClick={() => select(image.id)}
								title={image.name}
								className={`shrink-0 overflow-hidden rounded-md ring-2 transition-all ${
									active
										? 'size-40 ring-foreground'
										: 'size-20 opacity-70 ring-transparent hover:opacity-100 hover:ring-neutral-400'
								}`}
							>
								{/* biome-ignore lint/performance/noImgElement: 브라우저 object URL 미리보기 */}
								<img
									src={image.url}
									alt={image.name}
									className="size-full object-cover"
								/>
							</button>
						)
					})
				)}
			</div>

			{/* 선택 이미지 요약 */}
			{selected && (
				<p className="mt-3 truncate text-muted-foreground text-xs">
					선택됨: {selected.name} · 검수 결과는 곧 여기 연동됩니다
				</p>
			)}
		</div>
	)
}
