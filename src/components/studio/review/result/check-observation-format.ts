import type {
	AiCheckResult,
	CriterionComparison,
} from '@/features/asset-check/checkers/types'

type ObservationEntry = NonNullable<AiCheckResult['observations']>[number]

/** 검수 결과 표의 기준값 셀 문구. 판정 로직 없이 표기만 담당한다. */
export function formatObservationExpected(observation: ObservationEntry): string {
	if (typeof observation.expected !== 'number') {
		return observation.expected === 'present' ? '있어야 함' : '없어야 함'
	}
	const unit = observation.unit ?? ''
	if (observation.operator === 'gte') return `${observation.expected}${unit} 이상`
	if (observation.operator === 'lte') return `${observation.expected}${unit} 이하`
	return `${observation.expected}~${observation.max}${unit}`
}

/** 검수 결과 표의 관찰값 셀 문구. */
export function formatObservationActual(observation: ObservationEntry): string {
	if (typeof observation.actual === 'number') {
		return `${observation.actual}${observation.unit ?? ''}`
	}
	if (observation.actual === 'present') return '있음'
	if (observation.actual === 'absent') return '없음'
	if (observation.actual === 'not_applicable') return '해당 없음'
	return '판단 불가'
}

/**
 * deterministic 측정 → 화면 문구. AI 관찰 항목처럼 질문 한 줄과 서술 한 줄로 읽히게 한다.
 * 🔴 수치는 화면에 싣지 않는다 — 대비비 숫자는 읽는 사람의 판단을 돕지 않는다.
 *    측정값과 facts는 결과에 그대로 저장되므로 캘리브레이션은 그쪽을 읽는다.
 */
const MEASUREMENT_TEXT: Record<string, { question: string; satisfied: string; failed: string }> = {
	contrastRatio: {
		question: '전경과 배경의 대비가 충분한가?',
		satisfied: '전경과 배경이 뚜렷하게 구분됩니다.',
		failed: '전경과 배경의 밝기가 비슷해 구분이 어렵습니다.',
	},
	minContrastRatio: {
		question: '가장 나쁜 지점에서도 로고와 글자가 배경과 분리되는가?',
		satisfied: '가장 나쁜 지점에서도 배경과 분리됩니다.',
		failed: '배경과 거의 구분되지 않는 지점이 있습니다.',
	},
	p05ContrastRatio: {
		question: '로고와 글자가 배경과 충분히 분리되어 보이는가?',
		satisfied: '로고와 글자가 배경과 뚜렷하게 구분됩니다.',
		failed: '일부 구간에서 로고나 글자가 배경에 묻혀 잘 읽히지 않습니다.',
	},
	p50ContrastRatio: {
		question: '오버레이 전반이 배경과 분리되어 보이는가?',
		satisfied: '전반적으로 배경과 잘 분리됩니다.',
		failed: '전반적으로 배경과의 구분이 약합니다.',
	},
}

/** 측정의 질문문. AI 관찰 항목의 heading과 같은 자리에 놓인다. */
export function formatMeasurementQuestion(measurement: string): string {
	return MEASUREMENT_TEXT[measurement]?.question ?? measurement
}

/** 측정 결과의 서술 한 줄. AI 관찰의 reason과 같은 자리에 놓인다. */
export function formatComparisonNarrative(comparison: CriterionComparison): string | null {
	const text = MEASUREMENT_TEXT[comparison.measurement]
	if (!text) return null
	return comparison.satisfied ? text.satisfied : text.failed
}
