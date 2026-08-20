'use client'

import { useMemo } from 'react'
import { Controller } from '@/components/shared/controller'
import { CHECK_STATUS } from '@/components/studio/review/result/check-status'
import { CheckVerdictStatus } from '@/components/studio/review/result/check-verdict-status'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyTitle } from '@/components/ui/empty'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import {
	buildCheckReviewView,
	type CheckReviewRow,
} from '@/features/asset-check/utils/build-check-review-view'
import { checkDisplayStatus } from '@/features/asset-check/utils/check-display-status'
import { formatConfidence, ruleConfidence } from '@/features/asset-check/utils/check-image-verdict'
import { getCheckScenario } from '@/features/quality-rule/check-scenario'

/**
 * 선택한 파일의 룰별 판정 요약 — 카드 1장 = 룰 1개.
 * 행 구성은 buildCheckReviewView가 그대로 소유하고, 여기서는 킷 카드에 꽂기만 한다.
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
		<>
			{/* 어느 파일의 요약인지가 목록 행과 같은 모양으로 남는다(디자인 56:3). 정적 행이다. */}
			{selected && (
				<Controller.ListRow
					caption={
						scenarios.length > 0 && selected.scenarioKey
							? getCheckScenario(scenarios, selected.scenarioKey).title
							: '시나리오 없음'
					}
					label={selected.name}
					trailing={<CheckVerdictStatus image={selected} />}
				/>
			)}
			<Controller.Group
				collapsible={false}
				title="Summary"
				data-slot="review-summary"
				/*
				 * 🔴 바로 위 파일 행이 같은 판정을 이미 이름과 함께 싣고 있다 — 여기서 또 읽히면
				 *    스크린리더에 "미통과 미통과"가 된다. 디자인이 두 번 그린 것은 시각적 반복이므로
				 *    이쪽은 장식으로 둔다.
				 */
				trailing={
					selected ? (
						<span aria-hidden>
							<CheckVerdictStatus image={selected} />
						</span>
					) : undefined
				}
			>
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
			</Controller.Group>
		</>
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
		<Controller.Card
			badge={
				<Badge variant={status.variant} shape="rounded">
					{status.label}
				</Badge>
			}
			meta={confidence === null ? undefined : formatConfidence(confidence)}
			heading={row.check.titleKo ?? row.check.title}
			open={open}
			onClick={onOpen}
		>
			{row.detail}
		</Controller.Card>
	)
}
