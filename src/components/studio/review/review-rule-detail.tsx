'use client'

import { Controller } from '@/components/shared/controller'
import {
	formatComparisonNarrative,
	formatMeasurementQuestion,
	formatObservationActual,
	formatObservationExpected,
} from '@/components/studio/review/result/check-observation-format'
import { Empty, EmptyTitle } from '@/components/ui/empty'
import type {
	AiCheckResult,
	CheckResult,
	CriterionComparison,
} from '@/features/asset-check/checkers/types'
import { formatConfidence } from '@/features/asset-check/utils/check-image-verdict'

type Observation = NonNullable<AiCheckResult['observations']>[number]

/**
 * 선택한 룰의 판정 근거 — 기준(observation) 하나가 항목 하나다.
 * 요약 카드가 룰 단위로 접어 보여주는 것을 여기서 기준 단위로 편다.
 * 디자인 SSOT: Figma HD_LBS_UI 78:2706 "Review Detail - Expanded".
 *
 * 🔴 표면은 `Controller.Root`다 — 한때 그 클래스(rounded-xl·border·shadow-lg·overflow-hidden)를
 *    통째로 베껴 뒀었다. 패널이 둘로 늘어난 것이지 새 표면이 생긴 것이 아니다.
 *
 * 닫기 버튼은 없다(디자인 78:2709의 헤더는 제목뿐이다) — 닫기는 요약 카드 재클릭·파일 이동·
 * 목록 복귀가 갖고, 열림 상태는 이 컴포넌트가 아니라 컨텍스트(selectedRuleKey)가 소유한다.
 */
export function ReviewRuleDetail({ outcome }: { outcome: CheckResult }) {
	const observations =
		'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined
	// deterministic 룰은 관찰 대신 측정·기준 비교를 남긴다 — 근거 자리를 비워 두지 않는다.
	const comparisons = outcome.rawResult.comparisons

	return (
		<Controller.Root
			data-slot="review-rule-detail"
			// Root은 div다 — 이름 있는 랜드마크로 남기려면 role을 명시해야 한다(전에는 aside였다).
			role="complementary"
			aria-label={`${outcome.rule.title} 판정 근거`}
			className="lg:w-80"
		>
			<Controller.Content>
				{/* 제목은 List·Summary 패널과 같은 그룹 헤더 어휘다(디자인 78:2709 "Rule Name"). */}
				<Controller.Group collapsible={false} title={outcome.rule.title}>
					{observations?.length ? (
						observations.map((observation) => (
							<ObservationItem
								key={observation.criterionId}
								observation={observation}
							/>
						))
					) : comparisons?.length ? (
						comparisons.map((comparison) => (
							<ComparisonItem key={comparison.measurement} comparison={comparison} />
						))
					) : (
						<Empty className="gap-2 py-8">
							<EmptyTitle>이 룰은 기준별 근거를 남기지 않습니다</EmptyTitle>
						</Empty>
					)}
				</Controller.Group>
			</Controller.Content>
		</Controller.Root>
	)
}

/**
 * 측정 하나의 판정·기준·관찰·근거. AI 관찰 항목과 같은 3줄로 읽히게 맞춘다.
 * 신뢰도(meta)는 없다 — 픽셀을 직접 재므로 추정 확신도라는 개념이 없다.
 */
function ComparisonItem({ comparison }: { comparison: CriterionComparison }) {
	const narrative = formatComparisonNarrative(comparison)

	return (
		<Controller.Item
			data-slot="review-comparison"
			tone={comparison.satisfied ? 'success' : 'destructive'}
			status={comparison.satisfied ? 'Pass' : 'Fail'}
			heading={formatMeasurementQuestion(comparison.measurement)}
		>
			{narrative && <span>{narrative}</span>}
		</Controller.Item>
	)
}

/** 기준 하나의 판정·신뢰도·질문·근거. 판정 어휘는 satisfied 삼값에서 파생한다. */
function ObservationItem({ observation }: { observation: Observation }) {
	const verdict =
		observation.satisfied === true
			? { label: 'Pass', tone: 'success' as const }
			: observation.satisfied === false
				? { label: 'Fail', tone: 'destructive' as const }
				: { label: 'Review', tone: 'warning' as const }

	return (
		<Controller.Item
			data-slot="review-observation"
			tone={verdict.tone}
			status={verdict.label}
			meta={formatConfidence(observation.confidence)}
			heading={observation.question}
		>
			<span>
				기준 {formatObservationExpected(observation)} · 관찰{' '}
				{formatObservationActual(observation)}
			</span>
			{observation.reason && <span>{observation.reason}</span>}
		</Controller.Item>
	)
}
