import type { JSONFieldValidation } from 'payload'
import { validateGuidelineCheckOptionsValue } from '../services/validate-guideline-check-options.service'

/** Contrast Check의 options를 Admin UI와 무관하게 저장 경계에서 검증한다. */
export const validateGuidelineCheckOptions: JSONFieldValidation = async (
	value,
	{ req, siblingData },
) => {
	return validateGuidelineCheckOptionsValue({
		checkerValue: (siblingData as { checker?: unknown })?.checker,
		executor: (siblingData as { executor?: unknown })?.executor,
		req,
		value,
	})
}
