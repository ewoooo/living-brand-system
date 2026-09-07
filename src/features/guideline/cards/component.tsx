import { cn } from '@/lib/utils'
import type { BaseBlock } from '@/payload-types'
import { CardCaption } from './caption/component'
import { CARD_RATIO_CLASS, type CardRatio } from './displays/ratio'
import { renderDisplay } from './displays/registry.render'

export type CardData = NonNullable<BaseBlock['cards']>[number]

/**
 * 카드 하나 — 규격 비율의 판 + 캡션. 판은 테마 면(`bg-muted`)이고 디스플레이가 그 위를 채운다.
 * 판은 **높이 기준**이다: 블록이 `panelClassName`으로 줄 높이를 주면 폭이 비율에서 계산되고(md 이상),
 * 좁은 화면에서는 폭이 가득 차고 높이가 비율을 따른다. 캡션은 판 폭에 맞춰 아래에 붙는다.
 * 🔴 디스플레이가 없으면 그리지 않는다. 빈 판은 "규정이 없다"가 아니라 "고장"으로 읽힌다.
 */
export function Card({ card, panelClassName }: { card: CardData; panelClassName?: string }) {
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
					<div className="absolute inset-0 grid place-items-center">
						{renderDisplay(display)}
					</div>
				)}
			</div>
			<CardCaption caption={card.caption} />
		</figure>
	)
}
