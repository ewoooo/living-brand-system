import type { PayloadRequest } from 'payload'
import { getRuleCheckerSummary as readRuleCheckerSummary } from '../repositories/rule-checker.payload.repository'

/**
 * Rule 저장 훅에 Checker 식별자와 실행 방식을 제공한다.
 * RuleChecker 조회와 Payload 변환 I/O는 rule-checker repository가 소유한다.
 */
export async function getRuleCheckerSummary(req: PayloadRequest, checkerId: number) {
	return readRuleCheckerSummary(req, checkerId)
}
