import { DEFAULT_CONTENT_FLAGS, type ImageContentFlags } from '@/features/review/content-gate'
import { runReviewService } from '@/features/review/services/run-review.service'
import { authenticateRequest } from '@/lib/request-auth'

export const maxDuration = 30

const LEGACY_CONTENT_FLAGS: ImageContentFlags = {
	logo: true,
	typography: true,
	illustration: true,
	photography: true,
}

/** FormData의 flags(JSON 문자열)를 복원한다. 없으면 구형 호출로 보고 전 룰을 검수한다. */
function parseContentFlags(value: FormDataEntryValue | null | undefined): ImageContentFlags {
	if (value == null) return LEGACY_CONTENT_FLAGS
	if (typeof value !== 'string') return DEFAULT_CONTENT_FLAGS
	try {
		const raw = JSON.parse(value) as Partial<Record<keyof ImageContentFlags, unknown>>
		return {
			logo: raw.logo === true,
			typography: raw.typography === true,
			illustration: raw.illustration === true,
			photography: raw.photography === true,
		}
	} catch {
		return DEFAULT_CONTENT_FLAGS
	}
}

/**
 * 검수 대상 이미지(FormData)와 포함 요소 플래그를 받아 룰별 서버 확정 판정을 돌려준다.
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
		const results = await runReviewService(buffer, parseContentFlags(form?.get('flags')))

		return Response.json({ results })
	} catch (error) {
		payload.logger.error({ err: error }, 'review.check.failed')

		return Response.json({ message: 'Review failed.' }, { status: 500 })
	}
}
