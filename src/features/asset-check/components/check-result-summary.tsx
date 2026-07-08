'use client'

import { View, ViewFilled } from '@carbon/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import { buildCheckReviewView } from '@/features/asset-check/services/build-check-review-view.service'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { cn } from '@/lib/utils'

interface CheckResultSummaryProps {
	sections: CheckSection[]
}

/** 검수 결과 한눈 요약: 통과·미통과·검수 전 카운트 + 미통과만 보기 토글. */
export function CheckResultSummary({ sections }: CheckResultSummaryProps) {
	const { scenarioKey, selected, showFailOnly, toggleFailOnly } = useCheckImages()
	const failOnlyLabel = showFailOnly ? '전체 보기' : '미통과만 보기'
	const FailOnlyIcon = showFailOnly ? ViewFilled : View
	const { summary } = buildCheckReviewView({
		sections,
		scenarioKey,
		selected,
		showFailOnly,
	})

	return (
		<div className="mb-6 pl-2 flex flex-wrap items-center gap-x-5">
			<TooltipProvider delayDuration={150}>
				<section className="flex flex-wrap gap-4">
					<SummaryMetric
						label="PASS"
						value={summary.pass}
						colorClassName="bg-emerald-500"
					/>
					<SummaryMetric label="OK" value={summary.ok} colorClassName="bg-sky-500" />
					<SummaryMetric label="FAIL" value={summary.fail} colorClassName="bg-rose-500" />
					<SummaryMetric
						label="REVIEW"
						value={summary.pendingManualCheck}
						colorClassName="bg-amber-500"
						muted
					/>
				</section>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="ml-auto inline-flex">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={failOnlyLabel}
								onClick={toggleFailOnly}
								disabled={summary.fail === 0}
								className={cn(showFailOnly && 'text-rose-700 dark:text-rose-400')}
							>
								<FailOnlyIcon data-icon="inline-start" />
								<span className="sr-only">{failOnlyLabel}</span>
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>{failOnlyLabel}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}

function SummaryMetric({
	label,
	value,
	colorClassName,
	muted,
}: {
	label: string
	value: number
	colorClassName: string
	muted?: boolean
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					className={cn(
						'flex items-center gap-2 text-xs',
						muted && 'text-muted-foreground',
					)}
				>
					<span className={cn('inline-block size-2 rounded-full', colorClassName)} />
					<span className="sr-only">{label}</span>
					<span className="font-semibold tabular-nums">{value}</span>
				</span>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}
