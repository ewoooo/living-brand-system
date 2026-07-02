'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CONTENT_FLAG_LABELS, type ImageContentFlags } from '@/features/review/content-gate'
import { useReviewImages } from '@/features/review/image-context'
import { cn } from '@/lib/utils'

const CONTENT_FLAG_KEYS = Object.keys(CONTENT_FLAG_LABELS) as (keyof ImageContentFlags)[]

export function ImageSelector() {
	const {
		images,
		selectedId,
		selected,
		select,
		addFiles,
		contentFlags,
		flagsLocked,
		setContentFlag,
		runReview,
	} = useReviewImages()
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className="sticky top-14 z-10 flex h-56 flex-col justify-center gap-5 border-border border-b bg-background/95 px-8 backdrop-blur">
			{/* 업로드 + 검수 대상 썸네일 스트립 */}
			<div className="flex items-center gap-3 overflow-x-auto">
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
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
								className={cn(
									'shrink-0 overflow-hidden rounded-md transition-all',
									active
										? 'size-32 ring-2 ring-ring'
										: 'size-20 opacity-60 hover:opacity-100',
								)}
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

			{/* 포함 요소 (항상 표시, 검수 제출 시 잠금) + 검수 버튼 */}
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
				<span className="text-muted-foreground text-xs">포함 요소</span>
				{CONTENT_FLAG_KEYS.map((key) => (
					<label
						key={key}
						htmlFor={`content-flag-${key}`}
						className={cn(
							'flex items-center gap-2 text-sm',
							flagsLocked
								? 'cursor-not-allowed text-muted-foreground'
								: 'cursor-pointer text-foreground',
						)}
					>
						<Checkbox
							id={`content-flag-${key}`}
							checked={contentFlags[key]}
							disabled={flagsLocked}
							onCheckedChange={(checked) => setContentFlag(key, checked === true)}
						/>
						{CONTENT_FLAG_LABELS[key]}
					</label>
				))}
				<Button
					type="button"
					size="sm"
					className="ml-auto"
					disabled={!selectedId || Boolean(selected?.checking)}
					onClick={runReview}
				>
					{selected?.checking ? '검수 중…' : '검수'}
				</Button>
			</div>
		</div>
	)
}
