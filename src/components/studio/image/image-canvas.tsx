'use client'

import { ImageGenerationResults } from '@/components/studio/image/image-generation-results'
import { useImageStudio } from '@/features/image-generation/hooks/use-image-studio'
import { cn } from '@/lib/utils'

/**
 * 결과 캔버스 — 컨텍스트가 주는 것만 그리고 컨트롤러를 모른다.
 *
 * 🔑 두 가지를 보여준다. 방금 만든 결과가 있으면 그것이 우선이고, 없으면 좌측 갤러리에서 고른
 *    과거 묶음을 보여준다. 갤러리는 처음 열릴 때 가장 최근 묶음을 자동으로 고르므로 캔버스가
 *    빈 채로 남지 않는다 — 그래서 「이미지를 생성하세요」 안내가 없다(사용자 지시, 2026-09-21).
 */
export function ImageCanvas() {
	const { generation, results } = useImageStudio()

	if (!generation.busy && results.items.length === 0) {
		return <HistoryStackView />
	}

	return (
		<ImageGenerationResults
			aspectRatio={
				generation.busy
					? generation.ratio
					: (results.output?.aspectRatio ?? generation.ratio)
			}
			color={results.color}
			items={results.items}
			loading={generation.busy}
			onSelect={results.select}
			referenceIndex={results.referenceIndex}
			requested={results.requested}
			selected={results.selected}
		/>
	)
}

/**
 * 고른 묶음 — 선택한 장을 크게, 그 아래에 묶음 전체를 리스트로 그린다(사용자 지시, 2026-09-21).
 * 🔴 아무것도 안 골랐을 때는 아무것도 그리지 않는다. 갤러리가 곧 최근 묶음을 골라 주므로
 *    안내 문구를 넣으면 한 번 깜빡였다가 사라지는 자리가 된다.
 */
function HistoryStackView() {
	const { history } = useImageStudio()
	const selected =
		history.stack.find((item) => item.id === history.selectedId) ?? history.stack[0]
	if (!selected) return null

	const label = selected.prompt ?? selected.profileName ?? '생성 이미지'

	return (
		<div className="flex h-full min-h-0 flex-col items-center gap-4 p-4">
			<div className="flex min-h-0 flex-1 items-center justify-center">
				{/* biome-ignore lint/performance/noImgElement: 스튜디오 미리보기, 최적화 불필요 */}
				<img
					src={selected.url}
					alt={label}
					className="max-h-full max-w-full object-contain"
				/>
			</div>
			{/* 묶음이 한 장뿐이면 리스트가 같은 그림을 한 번 더 그리는 것뿐이라 뺀다. */}
			{history.stack.length > 1 && (
				<div className="flex shrink-0 flex-wrap justify-center gap-2">
					{history.stack.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => history.selectItem(item.id)}
							aria-current={item.id === selected.id || undefined}
							aria-label={item.prompt ?? '생성 이미지'}
							className={cn(
								'size-16 overflow-hidden rounded-md border bg-muted outline-none',
								'focus-visible:ring-2 focus-visible:ring-ring',
								item.id === selected.id
									? 'border-2 border-ring'
									: 'border-border hover:border-ring',
							)}
						>
							{/* biome-ignore lint/performance/noImgElement: 썸네일, 최적화 불필요 */}
							<img
								src={item.url}
								alt=""
								loading="lazy"
								className="size-full object-cover"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
