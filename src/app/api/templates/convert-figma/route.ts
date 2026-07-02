import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { Forbidden, getPayload } from 'payload'
import { z } from 'zod'
import { convertFigmaFrame } from '@/features/template-import/services/convert-figma-frame.service'
import { parseFigmaUrl } from '@/features/template-import/services/parse-figma-url'
import { FigmaConfigurationError } from '@/lib/errors'

// 이미지 조각 다운로드·업로드가 이어지므로 기본 시간보다 길게 잡는다.
export const maxDuration = 60

const convertFigmaRequestSchema = z.object({
	sourceUrl: z.string().min(1).max(500),
})

export async function parseConvertFigmaRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return convertFigmaRequestSchema.safeParse(body)
}

/**
 * Figma URL을 JsonTemplate으로 변환해 돌려주는 adapter. Admin의 Templates 폼 UI 필드가 호출한다.
 * Template 문서는 만들지 않으며, 에셋 쓰기 권한은 template-assets 컬렉션 access가 강제한다.
 */
export async function POST(req: Request) {
	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = await parseConvertFigmaRequest(req)

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
		if (error instanceof Forbidden) {
			return Response.json({ message: 'Forbidden' }, { status: 403 })
		}

		return Response.json({ message: 'Figma conversion failed.' }, { status: 500 })
	}
}
