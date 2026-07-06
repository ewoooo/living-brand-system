import { describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/templates/convert-figma/route'
import { convertFigmaFrame } from '@/features/template-import/services/convert-figma-frame.service'

vi.mock('@/lib/request-auth', () => ({
	authenticateRequest: vi.fn().mockResolvedValue({
		payload: { logger: { error: vi.fn() } },
		user: { id: 1, role: 'manager' },
	}),
}))
vi.mock('@/features/template-import/services/convert-figma-frame.service', () => ({
	convertFigmaFrame: vi.fn(),
}))

function buildRequest(body: string) {
	return new Request('http://localhost/api/templates/convert-figma', { body, method: 'POST' })
}

describe('template convert-figma route request parsing', () => {
	it('rejects malformed JSON', async () => {
		const response = await POST(buildRequest('{'))

		expect(response.status).toBe(400)
	})

	it('rejects missing sourceUrl', async () => {
		const response = await POST(buildRequest(JSON.stringify({})))

		expect(response.status).toBe(400)
	})

	it('accepts a valid body', async () => {
		const output = { jsonTemplate: { width: 1 }, skippedImageNodeIds: [] }
		vi.mocked(convertFigmaFrame).mockResolvedValue(output as never)

		const response = await POST(
			buildRequest(
				JSON.stringify({
					sourceUrl: 'https://www.figma.com/design/AbC123/banner?node-id=1-2',
				}),
			),
		)

		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toEqual(output)
	})
})
