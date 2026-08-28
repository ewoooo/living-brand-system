import { z } from 'zod'
import { isCmykIccProfile } from '@/features/studio-export/color-profile'
import { parsePrintPpi } from '@/features/studio-export/print-policy'
import {
	exportVectorPrint,
	VectorPrintInputError,
} from '@/features/studio-export/services/export-vector-print.service'
import { isPayloadUser } from '@/lib/auth'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'
import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'

export const maxDuration = 30

/** 씬은 이미지가 data URI로 들어와 커진다 — 래스터 인쇄 경로와 같은 상한을 쓴다. */
const MAX_SCENE_BYTES = 20_000_000

const requestSchema = z.object({
	colorProfile: z.string().optional(),
	ppi: z.unknown(),
	scene: z.object({
		width: z.number().positive(),
		height: z.number().positive(),
		background: z.string(),
		primitives: z.array(z.unknown()),
	}),
})

/**
 * Vector Scene을 인쇄용 CMYK PDF로 바꿔 준다.
 *
 * 🔴 서버에 있는 이유는 두 가지다 — ICC 색 변환(sharp)이 서버 전용이고, pdf-lib을 클라이언트
 *    번들에 넣지 않기 위해서다. SVG는 변환이 필요 없어 브라우저에서 바로 만든다.
 */
export async function POST(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}
	const { user } = await authenticateRequest()
	if (!isPayloadUser(user)) return Response.json({ message: 'Unauthorized.' }, { status: 401 })

	const body = await request.text()
	if (body.length > MAX_SCENE_BYTES) {
		return Response.json({ message: 'Scene is too large.' }, { status: 413 })
	}
	const parsed = requestSchema.safeParse(JSON.parse(body || 'null'))
	if (!parsed.success) return Response.json({ message: 'Invalid request.' }, { status: 400 })

	const { colorProfile, scene } = parsed.data
	if (colorProfile !== undefined && !isCmykIccProfile(colorProfile)) {
		return Response.json({ message: 'Invalid color profile.' }, { status: 400 })
	}
	// 🔴 기본값을 두지 않는다 — 빠뜨리면 페이지가 조용히 72ppi로 나가고, 인쇄물은 되돌릴 수 없다.
	const ppi = parsePrintPpi(parsed.data.ppi)
	if (ppi === undefined) return Response.json({ message: 'Invalid ppi.' }, { status: 400 })

	try {
		const pdf = await exportVectorPrint({
			...(colorProfile ? { colorProfile } : {}),
			ppi,
			scene: scene as VectorScene,
		})
		return new Response(new Uint8Array(pdf), {
			headers: {
				'Cache-Control': 'no-store',
				'Content-Disposition': 'attachment; filename="studio-export.pdf"',
				'Content-Length': String(pdf.byteLength),
				'Content-Type': 'application/pdf',
			},
		})
	} catch (error) {
		if (error instanceof VectorPrintInputError) {
			return Response.json({ message: 'Scene is too complex.' }, { status: 413 })
		}
		throw error
	}
}
