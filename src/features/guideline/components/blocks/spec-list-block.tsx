import type { GuidelineDocument } from '@/payload-types'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type SpecList = Extract<GuidelineBlock, { blockType: 'specList' }>

// Carbon structured-list 경량 이식: key-value 규격을 그룹별 카드로 나열한다.
// SpecTable(정량 표)보다 가벼운 카드형 — 타이포/그리드 규격처럼 라벨-값 쌍이 짧을 때 쓴다.
export function SpecListBlock({ block }: { block: SpecList }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{(block.groups ?? []).map((group) => (
				<div key={group.id} className="rounded-lg bg-background-secondary p-5">
					{group.label && (
						<h4 className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
							{group.label}
						</h4>
					)}
					<dl className={group.label ? 'mt-4' : ''}>
						{(group.specs ?? []).map((spec) => (
							<div
								key={spec.id}
								className="flex items-baseline justify-between gap-4 py-2.5"
							>
								<dt className="type-callout shrink-0 text-foreground-muted">
									{spec.key}
								</dt>
								<dd className="type-callout-emphasized text-right text-foreground tabular-nums">
									{spec.value}
								</dd>
							</div>
						))}
					</dl>
				</div>
			))}
		</div>
	)
}
