import type { CheckStatus, RawCheckResult } from '@/features/asset-check/checkers/types'

/** 표시 전용 상태 — 저장 status에 더해, 전 기준 해당 없음(pass + not_applicable)을 별도 배지로 구분한다. */
export type CheckDisplayStatus = CheckStatus | 'not_applicable'

/** 저장 결과 → 표시 상태. 전 기준 해당 없음인 pass만 not_applicable로 구분한다. */
export function checkDisplayStatus(
	rawResult: Pick<RawCheckResult, 'status' | 'reasonCode'>,
): CheckDisplayStatus {
	return rawResult.status === 'pass' && rawResult.reasonCode === 'not_applicable'
		? 'not_applicable'
		: rawResult.status
}
