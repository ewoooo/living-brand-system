import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { BaseBlock } from '@/payload-types'
import { CardCaption } from './caption/component'
import { CARD_RATIO_CLASS, type CardRatio } from './displays/ratio'
import { renderDisplay } from './displays/registry.render'

export type CardData = NonNullable<BaseBlock['cards']>[number]

/** 카드 판정 표식. 권장·금지는 상태 토큰, 허용은 중립 토큰을 쓴다(docs/09 §4). */
const MARK_STYLE: Record<
	Exclude<NonNullable<CardData['mark']>, 'none'>,
	{ symbol: string; label: string; className: string }
> = {
	do: { symbol: '✓', label: 'Do', className: 'text-success' },
	ok: { symbol: '△', label: 'OK', className: 'text-muted-foreground' },
	dont: { symbol: '✕', label: "Don't", className: 'text-destructive' },
}

/**
 * 카드 하나 — 규격 비율의 판 + 캡션. 판은 테마 면(`bg-muted`)이고 디스플레이가 그 위를 채운다.
 * 판은 **높이 기준**이다: 블록이 `panelClassName`으로 줄 높이를 주면 폭이 비율에서 계산되고(md 이상),
 * 좁은 화면에서는 폭이 가득 차고 높이가 비율을 따른다. 캡션은 판 아래 또는 판 위 하단에 붙으며 판 폭을 늘리지 않는다.
 * 🔴 디스플레이가 없으면 그리지 않는다. 빈 판은 "규정이 없다"가 아니라 "고장"으로 읽힌다.
 */
export function Card({ card, panelClassName }: { card: CardData; panelClassName?: string }) {
	const display = card.display?.[0]
	if (!display) return null
	const ratio = CARD_RATIO_CLASS[(card.ratio ?? '16:9') as CardRatio]
	const [width, height] = (card.ratio ?? '16:9').split(':').map(Number)
	const mark = card.mark

	return (
		<figure className="relative flex w-full flex-col self-start md:w-min">
			<div
				style={{ '--card-ratio': width / height } as CSSProperties}
				className={cn(
					'relative w-full overflow-clip rounded-3xl bg-muted md:w-auto',
					ratio,
					panelClassName,
				)}
			>
				{display.blockType === 'staticDisplay' ? (
					renderDisplay(display, { alt: card.caption?.title ?? undefined })
				) : (
					<div data-slot="card-display" className="absolute inset-0 overflow-clip">
						{renderDisplay(display)}
					</div>
				)}
				{mark && mark !== 'none' ? (
					<span
						role="img"
						aria-label={MARK_STYLE[mark].label}
						className={cn(
							'absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-background/80 font-body text-base leading-none',
							MARK_STYLE[mark].className,
						)}
					>
						{MARK_STYLE[mark].symbol}
					</span>
				) : null}
			</div>
			<CardCaption caption={card.caption} />
		</figure>
	)
}
