import { z } from 'zod'

const uiMessageSchema = z
	.object({
		id: z.string().min(1),
		role: z.enum(['system', 'user', 'assistant']),
		parts: z.array(z.object({ type: z.string() }).passthrough()).min(1),
	})
	.passthrough()

const agentChatRequestSchema = z.object({
	messages: z.array(uiMessageSchema).min(1),
	pagePath: z.string().max(300).optional(),
})

export async function parseAgentChatRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return agentChatRequestSchema.safeParse(body)
}
