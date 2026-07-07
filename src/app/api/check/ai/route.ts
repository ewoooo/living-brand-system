import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import type { User } from '@/payload-types'
import { completeCheckSessionAiCheck } from '@/services/start-check-session.service'

export const maxDuration = 30

const MAX_IMAGE_BYTES = 20_000_000

function isUser(value: unknown): value is User {
	return Boolean(value && typeof value === 'object' && 'email' in value && 'role' in value)
}

function parseRuleKeys(value: FormDataEntryValue | null | undefined): string[] {
	if (typeof value !== 'string') return []
	try {
		const raw = JSON.parse(value)
		return Array.isArray(raw) ? raw.filter((key) => typeof key === 'string') : []
	} catch {
		return []
	}
}

function parseCheckSessionId(value: FormDataEntryValue | null | undefined): number | null {
	const id = typeof value === 'string' ? Number(value) : NaN
	return Number.isInteger(id) ? id : null
}

export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()
	if (!isUser(user)) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const form = await req.formData().catch(() => null)
	const file = form?.get('image')
	const checkSessionId = parseCheckSessionId(form?.get('checkSessionId'))
	const ruleKeys = parseRuleKeys(form?.get('ruleKeys'))
	if (!(file instanceof File) || checkSessionId === null || ruleKeys.length === 0) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}
	if (file.size > MAX_IMAGE_BYTES) {
		return Response.json({ message: 'Image is too large.' }, { status: 413 })
	}

	try {
		const result = await completeCheckSessionAiCheck({
			buffer: Buffer.from(await file.arrayBuffer()),
			checkSessionId,
			ruleKeys,
			user,
		})

		return Response.json(result)
	} catch (error) {
		payload.logger.error({ err: error }, 'asset-check.ai.failed')

		return Response.json({ message: 'Check failed.' }, { status: 500 })
	}
}
