import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { Forbidden, getPayload } from 'payload'
import { z } from 'zod'
import { importFigmaTemplate } from '@/features/template-import/services/import-figma-template.service'
import { parseFigmaUrl } from '@/features/template-import/services/parse-figma-url'
import { FigmaConfigurationError } from '@/lib/errors'

// 이미지 조각 다운로드·업로드가 이어지므로 기본 시간보다 길게 잡는다.
export const maxDuration = 60

const importFigmaRequestSchema = z.object({
	name: z.string().min(1).max(120),
	sourceUrl: z.string().min(1).max(500),
})

export async function parseImportFigmaRequest(req: Request) {
	const body = await req.json().catch(() => null)

	return importFigmaRequestSchema.safeParse(body)
}

/**
 * Figma URL을 받아 draft Template 임포트를 실행하는 adapter.
 * 쓰기 권한은 Templates/TemplateAssets 컬렉션 access가 강제하고 여기서는 인증만 확인한다.
 */
export async function POST(req: Request) {
	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	if (!user) {
		return Response.json({ message: 'Unauthorized' }, { status: 401 })
	}

	const parsed = await parseImportFigmaRequest(req)

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
		const output = await importFigmaTemplate(user, {
			name: parsed.data.name,
			sourceUrl: parsed.data.sourceUrl,
			fileKey: source.fileKey,
			nodeId: source.nodeId,
		})

		return Response.json(output)
	} catch (error) {
		payload.logger.error({ err: error }, 'template-import.request.failed')

		if (error instanceof FigmaConfigurationError) {
			return Response.json({ message: error.message }, { status: 503 })
		}
		if (error instanceof Forbidden) {
			return Response.json({ message: 'Forbidden' }, { status: 403 })
		}

		return Response.json({ message: 'Template import failed.' }, { status: 500 })
	}
}
