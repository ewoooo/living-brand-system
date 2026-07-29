import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	exportTemplateTiff: vi.fn(),
	isCrossOriginRequest: vi.fn(),
}))

vi.mock('@/lib/request-auth', () => ({
	isCrossOriginRequest: mocks.isCrossOriginRequest,
}))
vi.mock('@/features/asset-generation/services/export-template-tiff.service', () => {
	class TemplateTiffInputError extends Error {}
	class TemplateTiffStaleError extends Error {}
	class TemplateTiffUnavailableError extends Error {}
	return {
		exportTemplateTiff: mocks.exportTemplateTiff,
		TemplateTiffInputError,
		TemplateTiffStaleError,
		TemplateTiffUnavailableError,
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
		['image', image],
		['templateId', '7'],
		['templateVersion', '2026-07-29T00:00:00.000Z'],
	])
	return {
		headers: new Headers({ 'x-forwarded-for': ip }),
		formData: async () => ({ get: (key: string) => values.get(key) ?? null }),
	} as Request
}

async function loadPost() {
	vi.resetModules()
	return (await import('./route')).POST
}

describe('POST /api/templates/export-tiff', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.isCrossOriginRequest.mockReturnValue(false)
		mocks.exportTemplateTiff.mockResolvedValue(Buffer.from('tiff'))
	})

	it('렌더에 사용한 템플릿 버전을 service에 전달하고 TIFF를 스트리밍한다', async () => {
		const POST = await loadPost()
		const response = await POST(exportRequest())

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('tiff')
		expect(mocks.exportTemplateTiff).toHaveBeenCalledWith({
			png: expect.any(Buffer),
			templateId: 7,
			templateVersion: '2026-07-29T00:00:00.000Z',
		})
	})

	it('동시에 두 번째 변환을 시작하지 않는다', async () => {
		const POST = await loadPost()
		let finish: ((buffer: Buffer) => void) | undefined
		mocks.exportTemplateTiff.mockReturnValue(
			new Promise<Buffer>((resolve) => {
				finish = resolve
			}),
		)

		const first = POST(exportRequest('127.0.0.1'))
		await vi.waitFor(() => expect(mocks.exportTemplateTiff).toHaveBeenCalledOnce())
		const second = await POST(exportRequest('127.0.0.2'))

		expect(second.status).toBe(429)
		finish?.(Buffer.from('tiff'))
		expect(await (await first).text()).toBe('tiff')
	})

	it('클라이언트별 분당 요청 수를 제한한다', async () => {
		const POST = await loadPost()

		for (let index = 0; index < 6; index += 1) {
			const response = await POST(exportRequest())
			expect(response.status).toBe(200)
			await response.arrayBuffer()
		}

		const response = await POST(exportRequest())
		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe('60')
	})
})
