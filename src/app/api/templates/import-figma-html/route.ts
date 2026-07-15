import { z } from 'zod'
import { importFigmaHtml } from '@/features/template-import/services/import-figma-html.service'
import { parseFigmaUrl } from '@/features/template-import/utils/parse-figma-url'
import { isManager, isPayloadUser } from '@/lib/auth'
import { FigmaConfigurationError } from '@/lib/errors'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

// Figma REST GET만 하므로 이미지 파이프라인보다 짧지만 여유를 둔다.
export const maxDuration = 30

const requestSchema = z.object({ sourceUrl: z.string().min(1).max(500) })

/**
 * Figma URL을 inline-style HTML로 변환해 돌려주는 adapter. Admin의 Templates 폼 UI 필드가 호출한다.
 * Template 문서는 만들지 않는다. 서버 FIGMA_API_TOKEN을 구동하므로 manager 이상만 허용한다 (docs/07).
 */
export async function POST(req: Request) {
	if (isCrossOriginRequest(req)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()

	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}
	if (!isPayloadUser(user) || !isManager(user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	const parsed = requestSchema.safeParse(await req.json().catch(() => null))

	if (!parsed.success) {
		return Response.json({ message: 'Invalid request.' }, { status: 400 })
	}

	const source = parseFigmaUrl(parsed.data.sourceUrl)

	if (!source) {
		return Response.json(
			{ message: 'A Figma design URL with node-id is required.' },
			{ status: 400 },
		)
	}

	try {
		const output = await importFigmaHtml(source, payload, user)

		return Response.json(output)
	} catch (error) {
		payload.logger.error({ err: error }, 'template-import.import-html.failed')

		if (error instanceof FigmaConfigurationError) {
			return Response.json({ message: error.message }, { status: 503 })
		}

		return Response.json({ message: 'Figma import failed.' }, { status: 500 })
	}
}
