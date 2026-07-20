import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from './common/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type Callout = Extract<GuidelineBlock, { blockType: 'callout' }>

// 규정/주의 콜아웃: 지켜야 할 규칙을 판정별(must/recommended/dont)로 강조하는 박스.
const kindStyle = {
	must: {
		symbol: '✓',
		label: '반드시',
		badge: 'bg-foreground text-background',
	},
	recommended: {
		symbol: '△',
		label: '권장',
		badge: 'bg-fill-selected text-foreground',
	},
	dont: {
		symbol: '✕',
		label: '금지',
		badge: 'bg-foreground text-background',
	},
} as const

export function CalloutBlock({ block }: { block: Callout }) {
	const style = kindStyle[block.kind]
	const items = block.items ?? []

	return (
		<GuidelineBlockFrame layout="padded">
			<div className="grid grid-cols-2">
				<div className="col-start-2 border border-neutral-200 p-6">
					<div className="flex items-center gap-3">
						<span
							aria-hidden
							className={`grid size-4 shrink-0 place-items-center rounded-full font-body text-xs font-medium ${style.badge}`}
						>
							{style.symbol}
						</span>
						<h4 className="font-body text-base font-semibold text-foreground">
							{block.title || style.label}
						</h4>
					</div>
					<ul className="mt-2 flex flex-col gap-2">
						{items.map((item) => (
							<li
								key={item.id}
								className="flex gap-2 font-body text-sm font-normal text-muted-foreground"
							>
								<span>{item.text}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</GuidelineBlockFrame>
	)
}
