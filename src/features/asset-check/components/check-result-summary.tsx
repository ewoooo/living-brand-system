'use client'

import { View, ViewFilled } from '@carbon/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import { filterRulesetByScenario, getCheckScenario } from '@/features/asset-check/scenarios'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { cn } from '@/lib/utils'

interface CheckResultSummaryProps {
	sections: CheckSection[]
}

/** 검수 결과 한눈 요약: 통과·미통과·검수 전 카운트 + 미통과만 보기 토글. */
export function CheckResultSummary({ sections }: CheckResultSummaryProps) {
	const { scenarioKey, selected, showFailOnly, toggleFailOnly } = useCheckImages()
	const results = selected?.results
	const failOnlyLabel = showFailOnly ? '전체 보기' : '미통과만 보기'
	const FailOnlyIcon = showFailOnly ? ViewFilled : View

	let pass = 0
	let ok = 0
	let fail = 0
	let pendingManualCheck = 0

	if (results) {
		for (const section of filterRulesetByScenario(sections, getCheckScenario(scenarioKey))) {
			for (const rule of section.rules) {
				if (!rule.implemented) continue
				const status = results[rule.key]?.rawResult.status
				if (status === 'pass') pass++
				else if (status === 'ok') ok++
				else if (status === 'fail') fail++
				else pendingManualCheck++
			}
		}
	}

	return (
		<div className="mb-6 pl-2 flex flex-wrap items-center gap-x-5">
			<TooltipProvider delayDuration={150}>
				<section className="flex flex-wrap gap-4">
					<SummaryMetric label="PASS" value={pass} colorClassName="bg-emerald-500" />
					<SummaryMetric label="OK" value={ok} colorClassName="bg-sky-500" />
					<SummaryMetric label="FAIL" value={fail} colorClassName="bg-rose-500" />
					<SummaryMetric
						label="REVIEW"
						value={pendingManualCheck}
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
								disabled={fail === 0}
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
