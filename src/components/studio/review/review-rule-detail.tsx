'use client'

import { Close } from '@carbon/icons-react'
import { Controller } from '@/components/shared/controller'
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
 *
 * 🔴 표면은 `Controller.Root`다 — 한때 그 클래스(rounded-xl·border·shadow-lg·overflow-hidden)를
 *    통째로 베껴 뒀었다. 패널이 둘로 늘어난 것이지 새 표면이 생긴 것이 아니다.
 */
export function ReviewRuleDetail({ outcome }: { outcome: CheckResult }) {
	const { selectRule } = useCheckImages()
	const observations =
		'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined

	return (
		<Controller.Root
			data-slot="review-rule-detail"
			// Root은 div다 — 이름 있는 랜드마크로 남기려면 role을 명시해야 한다(전에는 aside였다).
			role="complementary"
			aria-label={`${outcome.rule.title} 판정 근거`}
			className="lg:w-80"
		>
			{/* 제목과 닫기가 마주 앉고, 항목 목록이 자기 구분선을 가지므로 헤더 밑줄은 지운다(디자인 56:2087). */}
			<Controller.Header className="flex-row items-start justify-between gap-2 border-b-0">
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
			</Controller.Header>
			<Controller.Content>
				{observations?.length ? (
					observations.map((observation) => (
						<ObservationItem key={observation.criterionId} observation={observation} />
					))
				) : (
					<Empty className="gap-2 py-8">
						<EmptyTitle>이 룰은 기준별 근거를 남기지 않습니다</EmptyTitle>
					</Empty>
				)}
			</Controller.Content>
		</Controller.Root>
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
