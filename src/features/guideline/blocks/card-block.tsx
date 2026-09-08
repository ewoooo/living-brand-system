import { ContentFrame } from '@/components/shared/content-frame'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Card } from '@/features/guideline/cards/component'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { cn } from '@/lib/utils'
import type { BaseBlock } from '@/payload-types'
import type { RowHeight } from './fields'
import { CARD_ROW_HEIGHT, CARD_ROWS } from './rhythm'

/** 기본 블록과 슈거 블록이 공유하는 데이터 꼴. 슈거의 생성 타입은 이와 구조가 같다. */
export type CardBlockData = Pick<
	BaseBlock,
	'title' | 'description' | 'layout' | 'rowHeight' | 'cards'
>

/**
 * 카드 블록 렌더 — 머리(제목·설명)와 카드 배치. 블록이 정하는 것은 **레이아웃과 줄 높이**뿐이고,
 * 카드 폭은 각 카드의 비율에서 나온다. 카드 안은 `cards/component.tsx`가 그린다. 세로 리듬은 section과 같다.
 *
 * `title`을 넘기면 데이터의 제목을 덮는다 — 슈거 블록이 고정 제목("한 눈에 보기")을 주는 자리다.
 */
export function CardBlock({
	block,
	title = block.title,
	id,
}: {
	block: CardBlockData
	title?: string | null
	id?: string
}) {
	const cards = (block.cards ?? []).filter((card) => card.display?.length)
	const heading = title?.trim() || null
	if (!heading && !block.description && cards.length === 0) return null
	const rowHeight = CARD_ROW_HEIGHT[(block.rowHeight ?? 'medium') as RowHeight]

	const body =
		block.layout === 'carousel' ? (
			<Carousel
				opts={{ align: 'start' }}
				aria-label={heading ?? undefined}
				tabIndex={0}
				className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<CarouselContent viewportClassName="overflow-visible">
					{cards.map((card) => (
						// 슬라이드 폭은 카드가 정한다(basis-auto) — shadcn 기본 basis-full을 md에서 푼다.
						<CarouselItem key={card.id} className="md:basis-auto">
							<Card card={card} panelClassName={rowHeight} />
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>
		) : (
			<div className={CARD_ROWS}>
				{cards.map((card) => (
					<Card
						key={card.id}
						card={card}
						panelClassName={cn(rowHeight, 'md:max-h-[calc(100cqw/var(--card-ratio))]')}
					/>
				))}
			</div>
		)

	return (
		<section
			id={id}
			className={cn('flex flex-col gap-12', block.layout === 'carousel' && 'overflow-x-clip')}
		>
			{heading || block.description ? (
				<ContentFrame variant="heading">
					<div className="flex flex-col gap-8">
						<GuidelineHeader variant="section" title={heading} />
						<GuidelineDescription description={block.description} />
					</div>
				</ContentFrame>
			) : null}
			{cards.length > 0 ? <ContentFrame>{body}</ContentFrame> : null}
		</section>
	)
}
