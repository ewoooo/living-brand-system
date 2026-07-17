import { z } from 'zod'

const uiMessageSchema = z
	.object({
		id: z.string().min(1),
		role: z.enum(['user', 'assistant']),
		parts: z.array(z.object({ type: z.string() }).passthrough()).min(1),
	})
	.passthrough()

const unsafePathCharacterPattern = /[\p{Cc}\p{Zl}\p{Zp}?#\\]/u

const relativePathnameSchema = z
	.string()
	.max(300)
	.refine((value) => {
		if (
			!value.startsWith('/') ||
			value.startsWith('//') ||
			unsafePathCharacterPattern.test(value)
		) {
			return false
		}

		const url = new URL(value, 'http://local')
		return url.origin === 'http://local' && url.pathname === value
	})

const agentChatRequestSchema = z.object({
	messages: z.array(uiMessageSchema).min(1),
	pagePath: relativePathnameSchema.optional(),
})

export async function parseAgentChatRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return agentChatRequestSchema.safeParse(body)
}
