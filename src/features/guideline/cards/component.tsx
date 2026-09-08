import { cn } from '@/lib/utils'
import type { BaseBlock } from '@/payload-types'
import type { BlockMark } from '../blocks/fields'
import { CardCaption } from './caption/component'
import { CARD_RATIO_CLASS, type CardRatio } from './displays/ratio'
import { renderDisplay } from './displays/registry.render'

export type CardData = NonNullable<BaseBlock['cards']>[number]

/** 판정 표식. 금지만 빨강이고 나머지는 중립이다 — 상태 토큰만 쓴다(docs/09 §4). 옛 Do/Don't 위젯의 기호를 이어받았다. */
const MARK_STYLE: Record<
	Exclude<BlockMark, 'none'>,
	{ symbol: string; label: string; className: string }
> = {
	do: { symbol: '✓', label: 'Do', className: 'text-success' },
	ok: { symbol: '△', label: 'OK', className: 'text-muted-foreground' },
	dont: { symbol: '✕', label: "Don't", className: 'text-destructive' },
}

/**
 * 카드 하나 — 규격 비율의 판 + 캡션. 판은 테마 면(`bg-muted`)이고 디스플레이가 그 위를 채운다.
 * 판은 **높이 기준**이다: 블록이 `panelClassName`으로 줄 높이를 주면 폭이 비율에서 계산되고(md 이상),
 * 좁은 화면에서는 폭이 가득 차고 높이가 비율을 따른다. 캡션은 판 폭에 맞춰 아래에 붙는다.
 * 🔴 디스플레이가 없으면 그리지 않는다. 빈 판은 "규정이 없다"가 아니라 "고장"으로 읽힌다.
 */
export function Card({
	card,
	panelClassName,
	mark,
}: {
	card: CardData
	panelClassName?: string
	mark?: BlockMark | null
}) {
	const display = card.display?.[0]
	if (!display) return null
	const ratio = CARD_RATIO_CLASS[(card.ratio ?? '16:9') as CardRatio]

	return (
		<figure className="flex w-full flex-col md:w-auto">
			<div
				className={cn(
					'relative w-full overflow-hidden rounded-3xl bg-muted md:w-auto',
					ratio,
					panelClassName,
				)}
			>
				{display.blockType === 'staticDisplay' ? (
					renderDisplay(display, { alt: card.caption?.title ?? undefined })
				) : (
					// 콘텐츠 높이형 위젯은 판보다 클 수 있다 — 잘라 버리지 않고 판 안에서 스크롤한다.
					<div className="absolute inset-0 overflow-auto">
						<div className="flex min-h-full items-center justify-center">
							{renderDisplay(display)}
						</div>
					</div>
				)}
				{mark && mark !== 'none' ? (
					<span
						role="img"
						aria-label={MARK_STYLE[mark].label}
						className={cn(
							'absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-background/80 font-body text-base leading-none',
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
