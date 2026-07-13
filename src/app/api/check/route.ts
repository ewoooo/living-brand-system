import type { CheckSessionSource } from '@/features/asset-check/types'
import { isPayloadUser } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import { startCheckSession } from '@/services/start-check-session.service'
import { readCheckImage } from './read-check-image'

export const maxDuration = 30

function parseSource(value: FormDataEntryValue | null | undefined): CheckSessionSource {
	if (value === 'mcp-call') return 'mcp-call'
	return value === 'chat' ? 'chat' : 'review-page'
}

function parseScenarioKey(value: FormDataEntryValue | null | undefined): string | undefined {
	return typeof value === 'string' && value ? value : undefined
}

/**
 * 검수 대상 이미지(FormData)를 받아 시나리오 기준으로 룰별 서버 확정 판정을 돌려준다.
 * 브라우저 check 화면이 부르는 통로. 검수 세션 저장과 계산은 service가 소유한다.
 */
export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isPayloadUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const image = await readCheckImage(form?.get('image'))
	if ('response' in image) return image.response

	try {
		const result = await startCheckSession({
			buffer: image.buffer,
			deferHeuristic: true,
			imageName: image.name,
			scenarioKey: parseScenarioKey(form?.get('scenarioKey')),
			source: parseSource(form?.get('source')),
			user,
		})

		return Response.json(result)
	} catch (error) {
		payload.logger.error({ err: error }, 'asset-check.failed')

		return Response.json({ message: 'Check failed.' }, { status: 500 })
	}
}
