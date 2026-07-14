import { generateTextCandidates } from '@/features/text-generation/services/generate-text.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 30

export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { prompt, rule, count } = (await request.json().catch(() => ({}))) as {
		prompt?: string
		rule?: string
		count?: number
	}
	if (!prompt?.trim()) {
		return Response.json({ message: 'prompt required' }, { status: 400 })
	}
	const n = Math.min(Math.max(count ?? 3, 1), 6)

	// LLM 비용이 드는 경로라 인증 필요 (docs/07).
	const { payload, user } = await authenticateRequest()
	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	try {
		const texts = await generateTextCandidates({ prompt, rule, count: n })
		if (texts.length === 0) {
			return Response.json({ message: 'Text generation failed.' }, { status: 502 })
		}
		return Response.json({ texts })
	} catch (error) {
		payload.logger.error({ err: error }, 'text-generation.failed')
		return Response.json({ message: 'Text generation failed.' }, { status: 500 })
	}
}
