import type { JSONFieldValidation } from 'payload'
import { contrastOptionsSchema } from './contrast-options'
import { overlayLegibilityOptionsSchema } from './overlay-legibility-options'
import { relationshipId } from './relationship-id'
import { getRuleCheckerSummary } from './repositories/rule-checker.payload.repository'

/**
 * Contrast Rule의 options를 Admin UI와 무관하게 저장 경계에서 검증한다.
 * RuleChecker 조회와 Payload 변환 I/O는 rule-checker repository가 소유한다.
 */
export const validateRuleOptions: JSONFieldValidation = async (value, { req, siblingData }) => {
	if ((siblingData as { executor?: unknown })?.executor !== 'deterministic') return true

	const checkerValue = (siblingData as { checker?: unknown })?.checker
	let checkerKey =
		checkerValue && typeof checkerValue === 'object' && 'checkerKey' in checkerValue
			? (checkerValue as { checkerKey?: unknown }).checkerKey
			: undefined
	const checkerId = relationshipId(checkerValue)
	if (typeof checkerKey !== 'string' && checkerId !== null) {
		const checker = await getRuleCheckerSummary(req, checkerId)
		checkerKey = checker.checkerKey
	}

	if (checkerKey === 'contrast') {
		return (
			contrastOptionsSchema.safeParse(value).success ||
			'최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.'
		)
	}
	if (checkerKey === 'overlay-legibility') {
		return (
			overlayLegibilityOptionsSchema.safeParse(value).success ||
			'측정은 minContrastRatio·p05ContrastRatio·p50ContrastRatio 중 하나, 기준은 1~21 사이 숫자여야 합니다.'
		)
	}
	return true
}
