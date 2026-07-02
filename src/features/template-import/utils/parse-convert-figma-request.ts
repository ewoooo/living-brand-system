import { z } from 'zod'

/**
 * convert-figma 라우트의 요청 본문 계약.
 * route.ts는 HTTP 핸들러만 export해야 하므로(App Router 제약) 파서는 여기에 둔다.
 */
const convertFigmaRequestSchema = z.object({
	sourceUrl: z.string().min(1).max(500),
})

export async function parseConvertFigmaRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return convertFigmaRequestSchema.safeParse(body)
}
