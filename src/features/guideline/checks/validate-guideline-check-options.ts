import type { JSONFieldValidation } from 'payload'
import { contrastOptionsSchema } from '@/features/asset-check/checkers/contrast.checker'
import { getGuidelineRuleCheckerSummary } from '@/features/guideline/repositories/guideline-document.payload.repository'
import { relationshipId } from '@/features/guideline/utils/block-text'

/** Contrast Check의 options를 Admin UI와 무관하게 저장 경계에서 검증한다. */
export const validateGuidelineCheckOptions: JSONFieldValidation = async (
	value,
	{ req, siblingData },
) => {
	if ((siblingData as { executor?: unknown })?.executor !== 'deterministic') return true

	const checkerValue = (siblingData as { checker?: unknown })?.checker
	let checkerKey =
		checkerValue && typeof checkerValue === 'object' && 'checkerKey' in checkerValue
			? (checkerValue as { checkerKey?: unknown }).checkerKey
			: undefined
	const checkerId = relationshipId(checkerValue)
	if (typeof checkerKey !== 'string' && checkerId !== null) {
		const checker = await getGuidelineRuleCheckerSummary(req, checkerId)
		checkerKey = checker.checkerKey
	}

	return (
		checkerKey !== 'contrast' ||
		contrastOptionsSchema.safeParse(value).success ||
		'최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.'
	)
}
