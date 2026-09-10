import type { CSSProperties } from 'react'
import type { BaseBlock } from '@/payload-types'
import { type CardData, GuidelineCard } from '../../cards/component'
import styles from './grid-container.module.css'

/** 동일 너비의 카드를 배치하고, 마지막 행도 첫 열부터 같은 너비로 배치한다. */
export function GridContainer({
	cards,
	columns,
}: {
	cards: CardData[]
	columns?: BaseBlock['columns']
}) {
	return (
		<div
			data-slot="grid-container"
			className={styles.grid}
			style={{ '--grid-columns': Number(columns ?? 2) } as CSSProperties}
		>
			{cards.map((card) => (
				<GuidelineCard key={card.id} card={card} className={styles.card} />
			))}
		</div>
	)
}
