'use client'

import { useMemo } from 'react'
import { CHECK_STATUS } from '@/components/studio/review/result/check-status'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyTitle } from '@/components/ui/empty'
import { Typography } from '@/components/ui/typography'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import {
	buildCheckReviewView,
	type CheckReviewRow,
} from '@/features/asset-check/utils/build-check-review-view'
import { checkDisplayStatus } from '@/features/asset-check/utils/check-display-status'
import { formatConfidence, ruleConfidence } from '@/features/asset-check/utils/check-image-verdict'

/**
 * 선택한 파일의 룰별 판정 요약 — 카드 1장 = 룰 1개.
 * 행 구성은 buildCheckReviewView가 그대로 소유하고, 여기서는 카드로만 다시 그린다.
 * 디자인 SSOT: Figma HD_LBS_UI 56:3 "Review - Result".
 */
export function ReviewSummary({ sections }: { sections: CheckSection[] }) {
	const { scenarios, scenarioKey, selected, showFailOnly, selectedRuleKey, selectRule } =
		useCheckImages()
	const { rows } = useMemo(
		() => buildCheckReviewView({ sections, scenarios, scenarioKey, selected, showFailOnly }),
		[sections, scenarios, scenarioKey, selected, showFailOnly],
	)
	const judged = rows.filter((row) => row.outcome)

	return (
		<section data-slot="review-summary" className="flex flex-col gap-2 py-2">
			<Typography as="h2" size="sm" weight="semibold" tone="muted">
				Summary
			</Typography>
			{judged.length === 0 ? (
				<Empty className="gap-2 py-8">
					<EmptyTitle>아직 검수 결과가 없습니다</EmptyTitle>
				</Empty>
			) : (
				judged.map((row) => (
					<ReviewSummaryCard
						key={row.rowId}
						row={row}
						open={row.check.key === selectedRuleKey}
						onOpen={() =>
							selectRule(row.check.key === selectedRuleKey ? null : row.check.key)
						}
					/>
				))
			)}
		</section>
	)
}

function ReviewSummaryCard({
	row,
	open,
	onOpen,
}: {
	row: CheckReviewRow
	open: boolean
	onOpen: () => void
}) {
	// judged 필터를 통과한 행만 들어오므로 outcome은 항상 있다.
	const outcome = row.outcome
	if (!outcome) return null
	const status = CHECK_STATUS[checkDisplayStatus(outcome.rawResult)]
	const confidence = ruleConfidence(outcome)

	return (
		<button
			type="button"
			data-slot="review-summary-card"
			data-open={open || undefined}
			aria-expanded={open}
			onClick={onOpen}
			className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none data-[open]:ring-2 data-[open]:ring-foreground/20"
		>
			<div className="flex items-start justify-between gap-2">
				<Badge variant={status.variant} shape="rounded">
					{status.label}
				</Badge>
				{confidence !== null && (
					<Typography as="span" size="xs" tone="muted" className="font-mono">
						{formatConfidence(confidence)}
					</Typography>
				)}
			</div>
			<Typography as="h3" size="sm" weight="medium">
				{row.check.titleKo ?? row.check.title}
			</Typography>
			{row.detail && (
				<Typography as="p" size="xs" tone="muted">
					{row.detail}
				</Typography>
			)}
		</button>
	)
}
