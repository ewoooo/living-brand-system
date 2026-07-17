import type { GuidelineDocument } from '@/payload-types'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type Callout = Extract<GuidelineBlock, { blockType: 'callout' }>

// 규정/주의 콜아웃: 지켜야 할 규칙을 판정별(must/recommended/dont)로 강조하는 박스.
const kindStyle = {
	must: {
		symbol: '✓',
		label: '반드시',
		tint: 'bg-fill-muted',
		badge: 'bg-foreground text-background',
	},
	recommended: {
		symbol: '△',
		label: '권장',
		tint: 'bg-fill-muted',
		badge: 'bg-fill-selected text-foreground',
	},
	dont: {
		symbol: '✕',
		label: '금지',
		tint: 'bg-fill-muted',
		badge: 'bg-foreground text-background',
	},
} as const

export function CalloutBlock({ block }: { block: Callout }) {
	const style = kindStyle[block.kind]
	const items = block.items ?? []

	return (
		<div className={`rounded-lg ${style.tint} p-6`}>
			<div className="flex items-center gap-3">
				<span
					aria-hidden
					className={`type-caption-1-emphasized grid size-6 shrink-0 place-items-center rounded-full ${style.badge}`}
				>
					{style.symbol}
				</span>
				<h4 className="type-body-emphasized text-foreground">
					{block.title || style.label}
				</h4>
			</div>
			<ul className="mt-4 flex flex-col gap-2">
				{items.map((item) => (
					<li key={item.id} className="type-callout flex gap-2 text-foreground-muted">
						<span aria-hidden className="select-none text-foreground-muted">
							–
						</span>
						<span>{item.text}</span>
					</li>
				))}
			</ul>
		</div>
	)
}
