import { CheckSessionTerminalError } from '@/features/asset-check/domain/check-session'
import { isPayloadUser } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import { completeCheckSessionAiCheck } from '@/services/start-check-session.service'
import { readCheckImage } from '../read-check-image'

export const maxDuration = 30

function parseCheckSessionId(value: FormDataEntryValue | null | undefined): number | null {
	const id = typeof value === 'string' ? Number(value) : NaN
	return Number.isInteger(id) ? id : null
}

export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isPayloadUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const checkSessionId = parseCheckSessionId(form?.get('checkSessionId'))
	if (checkSessionId === null) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}
	const image = await readCheckImage(form?.get('image'))
	if ('response' in image) return image.response

	try {
		const result = await completeCheckSessionAiCheck({
			buffer: image.buffer,
			checkSessionId,
			user,
		})

		return Response.json(result)
	} catch (error) {
		if (error instanceof CheckSessionTerminalError) {
			return Response.json({ message: 'Check session already finished.' }, { status: 409 })
		}
		payload.logger.error({ err: error }, 'asset-check.ai.failed')

		return Response.json({ message: 'Check failed.' }, { status: 500 })
	}
}
