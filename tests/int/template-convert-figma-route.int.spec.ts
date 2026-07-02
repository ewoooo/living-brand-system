import { describe, expect, it } from 'vitest'
import { parseConvertFigmaRequest } from '@/features/template-import/services/parse-convert-figma-request'

describe('template convert-figma route request parsing', () => {
	it('rejects malformed JSON', async () => {
		const request = new Request('http://localhost/api/templates/convert-figma', {
			body: '{',
			method: 'POST',
		})

		const parsed = await parseConvertFigmaRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('rejects missing sourceUrl', async () => {
		const request = new Request('http://localhost/api/templates/convert-figma', {
			body: JSON.stringify({}),
			method: 'POST',
		})

		const parsed = await parseConvertFigmaRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('accepts a valid body', async () => {
		const request = new Request('http://localhost/api/templates/convert-figma', {
			body: JSON.stringify({
				sourceUrl: 'https://www.figma.com/design/AbC123/banner?node-id=1-2',
			}),
			method: 'POST',
		})

		const parsed = await parseConvertFigmaRequest(request)

		expect(parsed.success).toBe(true)
	})
})
