import { describe, expect, it } from 'vitest'
import { parseImportFigmaRequest } from '@/app/api/templates/import-figma/route'

describe('template import route request parsing', () => {
	it('rejects malformed JSON', async () => {
		const request = new Request('http://localhost/api/templates/import-figma', {
			body: '{',
			method: 'POST',
		})

		const parsed = await parseImportFigmaRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('rejects missing name or sourceUrl', async () => {
		const request = new Request('http://localhost/api/templates/import-figma', {
			body: JSON.stringify({ name: '' }),
			method: 'POST',
		})

		const parsed = await parseImportFigmaRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('accepts a valid body', async () => {
		const request = new Request('http://localhost/api/templates/import-figma', {
			body: JSON.stringify({
				name: '인스타 배너',
				sourceUrl: 'https://www.figma.com/design/AbC123/banner?node-id=1-2',
			}),
			method: 'POST',
		})

		const parsed = await parseImportFigmaRequest(request)

		expect(parsed.success).toBe(true)
	})
})
