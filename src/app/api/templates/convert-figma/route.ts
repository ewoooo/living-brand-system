import { z } from 'zod'
import { convertFigmaFrame } from '@/features/template-import/services/convert-figma-frame.service'
import { parseFigmaUrl } from '@/features/template-import/utils/parse-figma-url'
import { isManager } from '@/lib/auth'
import { AssetAccessDeniedError, FigmaConfigurationError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/request-auth'

// 이미지 조각 다운로드·업로드가 이어지므로 기본 시간보다 길게 잡는다.
export const maxDuration = 60

const convertFigmaRequestSchema = z.object({
	sourceUrl: z.string().min(1).max(500),
})

/**
 * Figma URL을 JsonTemplate으로 변환해 돌려주는 adapter. Admin의 Templates 폼 UI 필드가 호출한다.
 * Template 문서는 만들지 않는다. 서버 FIGMA_API_TOKEN을 구동하므로 manager 이상만 허용한다 (docs/07).
 */
export async function POST(req: Request) {
	// 쿠키 인증 라우트의 교차 출처 강제 실행 방지 (docs/07).
	const origin = req.headers.get('origin')
	const host = req.headers.get('host')

	if (origin && host && new URL(origin).host !== host) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload, user } = await authenticateRequest()

	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}
	if (!isManager(user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	const parsed = convertFigmaRequestSchema.safeParse(await req.json().catch(() => null))

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
		const output = await convertFigmaFrame(user, source)

		return Response.json(output)
	} catch (error) {
		payload.logger.error({ err: error }, 'template-import.convert.failed')

		if (error instanceof FigmaConfigurationError) {
			return Response.json({ message: error.message }, { status: 503 })
		}
		if (error instanceof AssetAccessDeniedError) {
			return Response.json({ message: 'Forbidden' }, { status: 403 })
		}

		return Response.json({ message: 'Figma conversion failed.' }, { status: 500 })
	}
}
