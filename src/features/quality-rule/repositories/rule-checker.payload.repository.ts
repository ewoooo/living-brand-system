import type { PayloadRequest } from 'payload'

/** Rule 저장 훅에 필요한 Checker 식별자와 실행 방식만 Payload에서 읽는다. */
export async function getRuleCheckerSummary(req: PayloadRequest, checkerId: number) {
	const checker = await req.payload.findByID({
		collection: 'rule-checkers',
		id: checkerId,
		depth: 0,
		draft: true,
		overrideAccess: !req.user,
		req,
		...(req.user ? { user: req.user } : {}),
	})

	return { checkerKey: checker.checkerKey, executor: checker.executor }
}
