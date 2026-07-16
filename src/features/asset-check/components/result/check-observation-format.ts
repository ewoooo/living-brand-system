import type { AiCheckResult } from '@/features/asset-check/checkers/types'

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
