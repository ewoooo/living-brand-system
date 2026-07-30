import type { JSONFieldValidation } from 'payload'
import { validateRuleOptionsValue } from './services/validate-rule-options.service'

/** Contrast Rule의 options를 Admin UI와 무관하게 저장 경계에서 검증한다. */
export const validateRuleOptions: JSONFieldValidation = async (value, { req, siblingData }) => {
	return validateRuleOptionsValue({
		checkerValue: (siblingData as { checker?: unknown })?.checker,
		executor: (siblingData as { executor?: unknown })?.executor,
		req,
		value,
	})
}
