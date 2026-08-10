'use client'

import { View, ViewFilled } from '@carbon/icons-react'
import { useMemo } from 'react'
import { useCheckImages } from '@/components/studio/review/check-image-provider'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { buildCheckReviewView } from '@/features/asset-check/utils/build-check-review-view'
import { cn } from '@/lib/utils'
import { CHECK_STATUS } from './check-status'

interface CheckResultSummaryProps {
	sections: CheckSection[]
}

/**
 * 퍼널 ④ — 상태별 카운트 요약 + 미통과만 보기 토글.
 * in : sections: CheckSection[] (서버) + 컨텍스트 { scenarios, scenarioKey, selected, showFailOnly }
 * 조립: buildCheckReviewView(...).summary → CheckReviewSummary {
 *   pass: number; ok: number; fail: number; advisory: number
 *   notApplicable: number          // display status 'not_applicable'
 *   pendingManualCheck: number     // outcome 없음(미판정·manual 대기)
 * }
 * 토글 disabled: summary.fail === 0
 */
export function CheckResultSummary({ sections }: CheckResultSummaryProps) {
	const { scenarios, scenarioKey, selected, showFailOnly, toggleFailOnly } = useCheckImages()
	const failOnlyLabel = showFailOnly ? '전체 보기' : '미통과만 보기'
	const FailOnlyIcon = showFailOnly ? ViewFilled : View
	const { summary } = useMemo(
		() => buildCheckReviewView({ sections, scenarios, scenarioKey, selected, showFailOnly }),
		[sections, scenarios, scenarioKey, selected, showFailOnly],
	)
	// 진행률: 판정 완료(results) + AI 후속 대기(pendingCheckKeys)로 전체 분모를 만든다.
	const doneCount = Object.keys(selected?.results ?? {}).length
	const totalCount = doneCount + (selected?.pendingCheckKeys?.length ?? 0)

	return (
		<div className="mb-6 flex flex-wrap items-center gap-x-5 pl-2">
			<TooltipProvider delayDuration={150}>
				{selected?.status === 'running' && (
					<span
						aria-live="polite"
						className="flex items-center gap-2 font-body text-xs font-normal text-muted-foreground"
					>
						<Spinner className="size-3.5" />
						{totalCount > 0
							? `검수 진행 중 ${doneCount}/${totalCount}`
							: '검수 진행 중'}
					</span>
				)}
				<section className="flex flex-wrap gap-4">
					{(
						[
							['pass', summary.pass],
							['ok', summary.ok],
							['advisory', summary.advisory],
							['fail', summary.fail],
							['not_applicable', summary.notApplicable],
							['needs_review', summary.pendingManualCheck],
						] as const
					).map(([status, value]) => (
						<SummaryMetric
							key={status}
							label={CHECK_STATUS[status].label}
							value={value}
							colorClassName={CHECK_STATUS[status].dot}
							muted={status === 'not_applicable' || status === 'needs_review'}
						/>
					))}
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
								className={cn(showFailOnly && 'text-destructive')}
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
	// 색만으로 상태를 구분하지 않도록 라벨을 텍스트로 함께 노출한다(docs/08 §2)
	return (
		<span
			className={cn(
				'flex items-center gap-2 font-body text-xs font-normal',
				muted && 'text-muted-foreground',
			)}
		>
			<span aria-hidden className={cn('inline-block size-2 rounded-full', colorClassName)} />
			<span>{label}</span>
			<span className="font-body text-xs font-medium tabular-nums">{value}</span>
		</span>
	)
}
