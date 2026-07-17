import type { PayloadRequest } from 'payload'
import { getGuidelineRuleCheckerSummary as readGuidelineRuleCheckerSummary } from '../repositories/guideline-document.payload.repository'

/**
 * Guideline Check 저장 훅에 Checker 식별자와 실행 방식을 제공한다.
 * RuleChecker 조회와 Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function getGuidelineRuleCheckerSummary(req: PayloadRequest, checkerId: number) {
	return readGuidelineRuleCheckerSummary(req, checkerId)
}
