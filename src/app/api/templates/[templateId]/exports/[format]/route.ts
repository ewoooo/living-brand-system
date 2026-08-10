import { z } from 'zod'
import {
	MAX_PRINT_PNG_BYTES,
	type TemplatePrintFormat,
} from '@/features/template-export/print-policy'
import {
	exportTemplatePrint,
	TemplatePrintInputError,
	TemplatePrintStaleError,
	TemplatePrintUnavailableError,
} from '@/features/template-export/services/export-template-print.service'
import { isCrossOriginRequest } from '@/lib/request-auth'

export const maxDuration = 30

const routeParamsSchema = z.object({
	format: z.enum(['pdf', 'tiff']),
	templateId: z.coerce.number().int().positive(),
})
const templateVersionSchema = z.string().min(1).max(100)
const RATE_WINDOW_MS = 60_000
const MAX_EXPORTS_PER_WINDOW = 30
const MAX_EXPORTS_PER_CLIENT = 6
const MAX_RATE_CLIENTS = 1_000
const OUTPUT_CHUNK_BYTES = 64 * 1024

const formats = {
	pdf: { contentType: 'application/pdf', extension: 'pdf' },
	tiff: { contentType: 'image/tiff', extension: 'tiff' },
} satisfies Record<TemplatePrintFormat, { contentType: string; extension: string }>

let activeExports = 0
let globalWindow = { count: 0, resetAt: 0 }
const clientWindows = new Map<string, { count: number; resetAt: number }>()

// ponytail: process-local 제한이다. 서버 인스턴스가 둘 이상이면 공유 edge/Redis limiter로 교체한다.
function takeRateLimit(request: Request, now = Date.now()): boolean {
	if (now >= globalWindow.resetAt) {
		globalWindow = { count: 0, resetAt: now + RATE_WINDOW_MS }
	}
	if (globalWindow.count >= MAX_EXPORTS_PER_WINDOW) return false

	const key =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip')?.trim() ||
		'anonymous'
	const current = clientWindows.get(key)
	const window =
		!current || now >= current.resetAt ? { count: 0, resetAt: now + RATE_WINDOW_MS } : current
	if (window.count >= MAX_EXPORTS_PER_CLIENT) return false

	if (!clientWindows.has(key) && clientWindows.size >= MAX_RATE_CLIENTS) {
		const oldestKey = clientWindows.keys().next().value
		if (oldestKey) clientWindows.delete(oldestKey)
	}
	window.count += 1
	clientWindows.set(key, window)
	globalWindow.count += 1
	return true
}

function streamOutput(buffer: Buffer, onDone: () => void): ReadableStream<Uint8Array> {
	let offset = 0
	let finished = false
	const finish = () => {
		if (finished) return
		finished = true
		onDone()
	}

	return new ReadableStream({
		cancel: finish,
		pull(controller) {
			const end = Math.min(offset + OUTPUT_CHUNK_BYTES, buffer.byteLength)
			controller.enqueue(
				new Uint8Array(buffer.buffer, buffer.byteOffset + offset, end - offset),
			)
			offset = end
			if (offset >= buffer.byteLength) {
				controller.close()
				finish()
			}
		},
	})
}

/** 브라우저 PNG를 검증된 CMYK 인쇄 파일로 변환하는 HTTP adapter. */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ format: string; templateId: string }> },
) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const routeParams = routeParamsSchema.safeParse(await params)
	if (!routeParams.success) {
		return Response.json({ message: 'Invalid route parameters.' }, { status: 400 })
	}
	if (!takeRateLimit(request)) {
		return Response.json(
			{ message: 'Too many print export requests.' },
			{ headers: { 'Retry-After': '60' }, status: 429 },
		)
	}
	if (activeExports >= 1) {
		return Response.json(
			{ message: 'Print export is busy.' },
			{ headers: { 'Retry-After': '1' }, status: 429 },
		)
	}
	activeExports += 1
	let streamOwnsSlot = false

	try {
		const form = await request.formData().catch(() => null)
		const templateVersion = templateVersionSchema.safeParse(form?.get('templateVersion'))
		const image = form?.get('image')

		if (!templateVersion.success || !(image instanceof File)) {
			return Response.json({ message: 'Invalid request.' }, { status: 400 })
		}
		if (image.size > MAX_PRINT_PNG_BYTES) {
			return Response.json({ message: 'Image is too large.' }, { status: 413 })
		}

		const result = await exportTemplatePrint({
			format: routeParams.data.format,
			png: Buffer.from(await image.arrayBuffer()),
			templateId: routeParams.data.templateId,
			templateVersion: templateVersion.data,
		})
		const output = formats[routeParams.data.format]
		const response = new Response(
			streamOutput(result, () => (activeExports -= 1)),
			{
				headers: {
					'Cache-Control': 'no-store',
					'Content-Length': String(result.byteLength),
					'Content-Disposition': `attachment; filename="template-${routeParams.data.templateId}.${output.extension}"`,
					'Content-Type': output.contentType,
				},
			},
		)
		streamOwnsSlot = true
		return response
	} catch (error) {
		if (error instanceof TemplatePrintStaleError) {
			return Response.json(
				{ message: 'Template changed. Refresh and retry.' },
				{ status: 409 },
			)
		}
		if (error instanceof TemplatePrintInputError) {
			return Response.json({ message: 'Invalid PNG.' }, { status: 400 })
		}
		if (error instanceof TemplatePrintUnavailableError) {
			return Response.json({ message: 'Print export is unavailable.' }, { status: 404 })
		}
		return Response.json({ message: 'Print export failed.' }, { status: 500 })
	} finally {
		if (!streamOwnsSlot) activeExports -= 1
	}
}
