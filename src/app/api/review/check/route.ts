import { runReviewService } from '@/features/review/services/run-review.service'
import { authenticateRequest } from '@/lib/request-auth'

export const maxDuration = 30

/**
 * 검수 대상 이미지(FormData)를 받아 룰별 서버 확정 판정을 돌려준다.
 * 브라우저 review 화면이 부르는 통로. 검수 계산은 service가 소유한다.
 */
export async function POST(req: Request) {
	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized.' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const file = form?.get('image')
	if (!(file instanceof File)) {
		return Response.json({ message: 'image is required.' }, { status: 400 })
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer())
		const results = await runReviewService(buffer)

		return Response.json({ results })
	} catch (error) {
		payload.logger.error({ err: error }, 'review.check.failed')

		return Response.json({ message: 'Review failed.' }, { status: 500 })
	}
}
