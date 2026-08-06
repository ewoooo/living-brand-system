import type { CheckResult } from '@/features/asset-check/checkers/types'

/** 구조화된 판정을 사용자에게 설명할 한국어 문구로 바꾼다. 기존 세션은 message로 전달한다. */
export function formatCheckDetail(outcome: CheckResult): string | null {
	const { rawResult } = outcome

	if (rawResult.reasonCode === 'not_applicable') return '관측 대상 없음'
	if ('summary' in rawResult && rawResult.summary) {
		if (rawResult.status === 'fail') {
			return `기준 ${rawResult.summary.failed}개를 통과하지 못했어요.`
		}
		if (rawResult.status === 'needs_review') {
			return `기준 ${rawResult.summary.uncertain}개는 판단이 필요해요.`
		}
		if (rawResult.status === 'pass') {
			return `기준 ${rawResult.summary.satisfied}개를 모두 통과했어요.`
		}
	}

	return outcome.message ?? rawResult.detail ?? null
}
