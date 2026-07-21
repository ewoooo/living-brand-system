import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type SpecList = Extract<GuidelineBlock, { blockType: 'specList' }>

// Carbon structured-list 경량 이식: key-value 규격을 그룹별 카드로 나열한다.
// SpecTable(정량 표)보다 가벼운 카드형 — 타이포/그리드 규격처럼 라벨-값 쌍이 짧을 때 쓴다.
export function SpecListBlock({ block }: { block: SpecList }) {
	return (
		<GuidelineBlockFrame layout="padded">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{(block.groups ?? []).map((group) => (
					<div key={group.id} className="rounded-lg bg-background-secondary p-5">
						{group.label && (
							<h4 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{group.label}
							</h4>
						)}
						<dl className={group.label ? 'mt-4' : ''}>
							{(group.specs ?? []).map((spec) => (
								<div
									key={spec.id}
									className="flex items-baseline justify-between gap-4 py-2.5"
								>
									<dt className="shrink-0 font-body text-sm font-normal text-muted-foreground">
										{spec.key}
									</dt>
									<dd className="text-right font-body text-sm font-semibold text-foreground tabular-nums">
										{spec.value}
									</dd>
								</div>
							))}
						</dl>
					</div>
				))}
			</div>
		</GuidelineBlockFrame>
	)
}

export default SpecListBlock
