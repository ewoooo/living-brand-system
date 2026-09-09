import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { BaseBlock } from '@/payload-types'
import { GuidelineControllerScope } from '../controllers/provider'
import { cardControllerFor } from '../controllers/registry'
import { DisplayCaption } from './caption/display-caption'
import { CardDisplay } from './displays/card-display'
import { CARD_RATIO_CLASS, DYNAMIC_CARD_RATIO } from './displays/ratio'
import { CardMark } from './mark'

export type CardData = NonNullable<BaseBlock['cards']>[number]

/** 카드 프레임·표본·표식·캡션을 조합한다. 조작 상태는 카드별로 격리한다. */
export function GuidelineCard({
	card,
	panelClassName,
	className,
}: {
	card: CardData
	panelClassName?: string
	className?: string
}) {
	const display = card.display?.[0]
	if (!display) return null
	const cardRatio = DYNAMIC_CARD_RATIO[display.blockType] ?? card.ratio ?? '16:9'
	const [width, height] = cardRatio.split(':').map(Number)
	const controller = cardControllerFor(display)
	const content = (
		<figure
			className={cn('relative flex w-full min-w-0 flex-col self-start md:w-min', className)}
		>
			<div
				style={{ '--card-ratio': width / height } as CSSProperties}
				className={cn(
					'relative w-full overflow-clip rounded-3xl bg-muted md:w-auto',
					CARD_RATIO_CLASS[cardRatio],
					panelClassName,
					className,
				)}
			>
				<CardDisplay
					display={display}
					title={card.caption?.title}
					controllerLabel={controller?.manifest.id}
				/>
				<CardMark mark={card.mark} />
			</div>
			<DisplayCaption caption={card.caption} display={display} />
		</figure>
	)
	return controller ? (
		<GuidelineControllerScope {...controller}>{content}</GuidelineControllerScope>
	) : (
		content
	)
}
