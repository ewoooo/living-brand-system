import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	exportTemplatePrint: vi.fn(),
	isCrossOriginRequest: vi.fn(),
}))

vi.mock('@/lib/request-auth', () => ({
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/studio-export/services/export-template-print.service', () => {
	class TemplatePrintInputError extends Error {}
	class TemplatePrintStaleError extends Error {}
	class TemplatePrintUnavailableError extends Error {}
	return {
		exportTemplatePrint: mocks.exportTemplatePrint,
		TemplatePrintInputError,
		TemplatePrintStaleError,
		TemplatePrintUnavailableError,
	}
})

function exportRequest(ip = '127.0.0.1') {
	const image = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'template.png', {
		type: 'image/png',
	})
	Object.defineProperty(image, 'arrayBuffer', {
		value: async () => Uint8Array.from([0x89, 0x50, 0x4e, 0x47]).buffer,
	})
	const values = new Map<string, FormDataEntryValue>([
		['colorProfile', 'cgats21-crpc6'],
		['image', image],
		['templateVersion', '2026-07-29T00:00:00.000Z'],
	])
	return {
		headers: new Headers({ 'x-forwarded-for': ip }),
		formData: async () => ({ get: (key: string) => values.get(key) ?? null }),
	} as Request
}

function routeContext(format = 'tiff', templateId = '7') {
	return { params: Promise.resolve({ format, templateId }) }
}

async function loadPost() {
	vi.resetModules()
	return (await import('./route')).POST
}

describe('POST /api/templates/[templateId]/exports/[format]', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.exportTemplatePrint.mockResolvedValue(Buffer.from('print'))
	})

	it.each([
		['pdf', 'application/pdf', 'template-7.pdf'],
		['tiff', 'image/tiff', 'template-7.tiff'],
	])('%s 경로를 해당 인쇄 형식으로 변환한다', async (format, contentType, fileName) => {
		const POST = await loadPost()
		const response = await POST(exportRequest(), routeContext(format))

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(contentType)
		expect(response.headers.get('Content-Disposition')).toContain(fileName)
		expect(await response.text()).toBe('print')
		expect(mocks.exportTemplatePrint).toHaveBeenCalledWith({
			colorProfile: 'cgats21-crpc6',
			format,
			png: expect.any(Buffer),
			templateId: 7,
			templateVersion: '2026-07-29T00:00:00.000Z',
		})
	})

	it('지원하지 않는 경로 파라미터는 I/O 전에 거부한다', async () => {
		const POST = await loadPost()
		const response = await POST(exportRequest(), routeContext('png', 'invalid'))

		expect(response.status).toBe(400)
		expect(mocks.exportTemplatePrint).not.toHaveBeenCalled()
	})

	it('동시에 두 번째 변환을 시작하지 않는다', async () => {
		const POST = await loadPost()
		let finish: ((buffer: Buffer) => void) | undefined
		mocks.exportTemplatePrint.mockReturnValue(
			new Promise<Buffer>((resolve) => {
				finish = resolve
			}),
		)

		const first = POST(exportRequest('127.0.0.1'), routeContext('pdf'))
		await vi.waitFor(() => expect(mocks.exportTemplatePrint).toHaveBeenCalledOnce())
		const second = await POST(exportRequest('127.0.0.2'), routeContext('tiff'))

		expect(second.status).toBe(429)
		finish?.(Buffer.from('print'))
		expect(await (await first).text()).toBe('print')
	})

	it('클라이언트별 분당 요청 수를 제한한다', async () => {
		const POST = await loadPost()

		for (let index = 0; index < 6; index += 1) {
			const response = await POST(exportRequest(), routeContext())
			expect(response.status).toBe(200)
			await response.arrayBuffer()
		}

		const response = await POST(exportRequest(), routeContext())
		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe('60')
	})
})
