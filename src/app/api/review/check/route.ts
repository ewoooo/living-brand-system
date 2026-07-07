import type { CheckSessionSource } from '@/features/review/repositories/check-session.payload.repository'
import { DEFAULT_CONTENT_FLAGS, type ImageContentFlags } from '@/features/review/types'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import type { User } from '@/payload-types'
import { startCheckSession } from '@/services/start-check-session.service'

export const maxDuration = 30

const MAX_IMAGE_BYTES = 20_000_000 // 20MB — 무검증 Buffer 적재로 인한 메모리 고갈 방지 (docs/07 #17)

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

function parseSource(value: FormDataEntryValue | null | undefined): CheckSessionSource {
	if (value === 'mcp-call') return 'mcp-call'
	return value === 'chat' ? 'chat' : 'review-page'
}

function parseScenarioKey(value: FormDataEntryValue | null | undefined): string | undefined {
	return typeof value === 'string' && value ? value : undefined
}

function isUser(value: unknown): value is User {
	return Boolean(value && typeof value === 'object' && 'email' in value && 'role' in value)
}

/**
 * 검수 대상 이미지(FormData)와 포함 요소 플래그를 받아 룰별 서버 확정 판정을 돌려준다.
 * 브라우저 review 화면이 부르는 통로. 검수 세션 저장과 계산은 service가 소유한다.
 */
export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isUser(user)) {
		return Response.json({ message: 'Unauthorized.' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const file = form?.get('image')
	if (!(file instanceof File)) {
		return Response.json({ message: 'image is required.' }, { status: 400 })
	}
	if (file.size > MAX_IMAGE_BYTES) {
		return Response.json({ message: 'Image is too large.' }, { status: 413 })
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer())
		const result = await startCheckSession({
			buffer,
			flags: parseContentFlags(form?.get('flags')),
			imageName: file.name,
			scenarioKey: parseScenarioKey(form?.get('scenarioKey')),
			source: parseSource(form?.get('source')),
			user,
		})

		return Response.json(result)
	} catch (error) {
		payload.logger.error({ err: error }, 'review.check.failed')

		return Response.json({ message: 'Review failed.' }, { status: 500 })
	}
}
