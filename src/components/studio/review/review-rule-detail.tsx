'use client'

import { Close } from '@carbon/icons-react'
import {
	formatObservationActual,
	formatObservationExpected,
} from '@/components/studio/review/result/check-observation-format'
import { Button } from '@/components/ui/button'
import { Empty, EmptyTitle } from '@/components/ui/empty'
import { Typography } from '@/components/ui/typography'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import { formatConfidence } from '@/features/asset-check/utils/check-image-verdict'

type Observation = NonNullable<AiCheckResult['observations']>[number]

/**
 * 선택한 룰의 판정 근거 — 기준(observation) 하나가 항목 하나다.
 * 요약 카드가 룰 단위로 접어 보여주는 것을 여기서 기준 단위로 편다.
 * 디자인 SSOT: Figma HD_LBS_UI 56:2087 "Review - Result Detail".
 */
export function ReviewRuleDetail({ outcome }: { outcome: CheckResult }) {
	const { selectRule } = useCheckImages()
	const observations =
		'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined

	return (
		<aside
			data-slot="review-rule-detail"
			aria-label={`${outcome.rule.title} 판정 근거`}
			className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg lg:w-80"
		>
			<header className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-4">
				<Typography as="h2" size="sm" weight="semibold">
					{outcome.rule.title}
				</Typography>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="판정 근거 닫기"
					onClick={() => selectRule(null)}
				>
					<Close aria-hidden />
				</Button>
			</header>
			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
				{observations?.length ? (
					observations.map((observation) => (
						<ObservationItem key={observation.criterionId} observation={observation} />
					))
				) : (
					<Empty className="gap-2 py-8">
						<EmptyTitle>이 룰은 기준별 근거를 남기지 않습니다</EmptyTitle>
					</Empty>
				)}
			</div>
		</aside>
	)
}

/** 기준 하나의 판정·신뢰도·질문·근거. 판정 어휘는 satisfied 삼값에서 파생한다. */
function ObservationItem({ observation }: { observation: Observation }) {
	const verdict =
		observation.satisfied === true
			? { label: 'Pass', className: 'text-success' }
			: observation.satisfied === false
				? { label: 'Fail', className: 'text-destructive' }
				: { label: 'Review', className: 'text-warning' }

	return (
		<article data-slot="review-observation" className="flex flex-col gap-1">
			<div className="flex items-baseline justify-between gap-2">
				<Typography as="span" size="xs" weight="medium" className={verdict.className}>
					{verdict.label}
				</Typography>
				<Typography as="span" size="xs" tone="muted" className="font-mono">
					{formatConfidence(observation.confidence)}
				</Typography>
			</div>
			<Typography as="h3" size="sm" weight="medium">
				{observation.question}
			</Typography>
			<Typography as="p" size="xs" tone="muted">
				기준 {formatObservationExpected(observation)} · 관찰{' '}
				{formatObservationActual(observation)}
			</Typography>
			{observation.reason && (
				<Typography as="p" size="xs" tone="muted">
					{observation.reason}
				</Typography>
			)}
		</article>
	)
}
