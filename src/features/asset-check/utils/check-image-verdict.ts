import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckImage } from '@/features/asset-check/types'
import { checkDisplayStatus } from '@/features/asset-check/utils/check-display-status'

/**
 * 파일 한 건의 종합 판정. 룰별 판정(CheckDisplayStatus)과 달리 리스트 행 하나가 갖는 상태이므로
 * 검수 진행 상태('idle'|'running'|'failed')와 판정 결과를 같은 어휘로 합친다.
 * 'ok'·'not_applicable'은 표시되지 않는다 — 아래 VERDICT_RANK 주석 참조.
 */
export type CheckImageVerdict =
	| 'idle'
	| 'running'
	| 'failed'
	| 'pass'
	| 'advisory'
	| 'needs_review'
	| 'fail'

/**
 * 최악 우선 순위. 값이 클수록 먼저 표시한다.
 * 'not_applicable'은 pass와 같은 칸(0)에 둬 ✓로 접고, 'ok'는 아무 checker도 만들지 않는 값이라
 * pass와 같이 취급한다.
 */
const VERDICT_RANK: Record<string, number> = {
	not_applicable: 0,
	ok: 0,
	pass: 0,
	advisory: 1,
	needs_review: 2,
	fail: 3,
}

const RANKED_VERDICT: CheckImageVerdict[] = ['pass', 'advisory', 'needs_review', 'fail']

/**
 * 파일 하나의 룰별 판정을 최악 우선으로 접어 리스트 행에 표시할 상태를 만든다.
 * 진행 상태가 판정보다 우선한다 — 검수 중에는 부분 결과가 있어도 'running'이다.
 */
export function checkImageVerdict(image: CheckImage): CheckImageVerdict {
	if (image.status === 'running') return 'running'
	if (image.status === 'failed') return 'failed'

	const outcomes = Object.values(image.results ?? {})
	// 결과가 없으면 아직 판정할 것이 없다. status가 'completed'여도 표시할 판정은 없다.
	if (outcomes.length === 0) return 'idle'

	let rank = 0
	for (const outcome of outcomes) {
		rank = Math.max(rank, VERDICT_RANK[checkDisplayStatus(outcome.rawResult)] ?? 0)
	}
	return RANKED_VERDICT[rank]
}

/**
 * 룰 한 건의 신뢰도(%) — AI 관측 confidence의 최솟값.
 * 가장 약한 근거가 그 룰의 신뢰도다. 평균은 불확실한 관측을 확실한 관측이 가린다.
 * 관측이 없는 룰(deterministic·manual)은 null이다.
 */
export function ruleConfidence(outcome: CheckResult): number | null {
	const observations = (
		'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined
	) as AiCheckResult['observations']
	if (!observations?.length) return null
	return Math.min(...observations.map((observation) => observation.confidence))
}
