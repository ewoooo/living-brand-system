import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VectorLayerEditor } from './vector-layer-editor'

const responses = {
	'brand-logos': [{ id: 7, name: 'Wordmark', alt: 'Wordmark', url: '/logo.svg' }],
	'application-images': [],
	'brand-colors': [
		{ id: 3, name: 'Primary', hex: '#112233' },
		{ id: 4, name: 'Unsafe', hex: 'url(https://example.com/pixel)' },
	],
}

describe('VectorLayerEditor', () => {
	it('인가 자산·맞춤 방식·브랜드 컬러 변경을 전달한다', async () => {
		const fetchMock = vi.fn((url: string) => {
			const collection = Object.keys(responses).find((key) => url.includes(`/api/${key}?`))
			return Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({ docs: responses[collection as keyof typeof responses] }),
			})
		})
		vi.stubGlobal('fetch', fetchMock)
		HTMLElement.prototype.scrollIntoView = vi.fn()
		const onChange = vi.fn()

		render(createElement(VectorLayerEditor, { name: 'Vector', config: {}, onChange }))

		const assetSelect = screen.getByRole('combobox', { name: '브랜드 내부 자산' })
		fireEvent.click(assetSelect)
		await waitFor(() => expect(screen.getByRole('option', { name: 'Wordmark' })).toBeTruthy())
		fireEvent.click(screen.getByRole('option', { name: 'Wordmark' }))
		fireEvent.click(screen.getByRole('radio', { name: 'Contain' }))
		fireEvent.click(screen.getByRole('button', { name: 'Primary #112233' }))

		expect(screen.queryByRole('button', { name: /Unsafe/ })).toBeNull()
		expect(fetchMock).toHaveBeenCalledTimes(3)
		expect(onChange).toHaveBeenNthCalledWith(1, {
			vectorAsset: { collection: 'brand-logos', id: 7, src: '/logo.svg' },
		})
		expect(onChange).toHaveBeenNthCalledWith(2, { vectorFit: 'contain' })
		expect(onChange).toHaveBeenNthCalledWith(3, { vectorColor: '#112233' })
	})
})
