import type { PayloadRequest } from 'payload'
import { contrastOptionsSchema } from '../contrast-options'
import { relationshipId } from '../relationship-id'
import { getRuleCheckerSummary } from '../repositories/rule-checker.payload.repository'

/**
 * Deterministic Rule의 Checker별 options 저장 규칙을 검증한다.
 * RuleChecker 조회와 Payload 변환 I/O는 rule-checker repository가 소유한다.
 */
export async function validateRuleOptionsValue({
	checkerValue,
	executor,
	req,
	value,
}: {
	checkerValue: unknown
	executor: unknown
	req: PayloadRequest
	value: unknown
}) {
	if (executor !== 'deterministic') return true

	let checkerKey =
		checkerValue && typeof checkerValue === 'object' && 'checkerKey' in checkerValue
			? (checkerValue as { checkerKey?: unknown }).checkerKey
			: undefined
	const checkerId = relationshipId(checkerValue)
	if (typeof checkerKey !== 'string' && checkerId !== null) {
		const checker = await getRuleCheckerSummary(req, checkerId)
		checkerKey = checker.checkerKey
	}

	return (
		checkerKey !== 'contrast' ||
		contrastOptionsSchema.safeParse(value).success ||
		'최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.'
	)
}
