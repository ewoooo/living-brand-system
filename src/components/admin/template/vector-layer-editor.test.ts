import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VectorLayerEditor } from './vector-layer-editor'

const responses = {
	'brand-logos': [{ id: 7, name: 'Wordmark', alt: 'Wordmark', url: '/logo.svg' }],
	'application-images': [],
	'brand-colors': [{ id: 3, name: 'Primary', hex: '#112233' }],
}

describe('VectorLayerEditor', () => {
	it('인가 자산·맞춤 방식·브랜드 컬러 변경을 전달한다', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string) => {
				const collection = Object.keys(responses).find((key) =>
					url.includes(`/api/${key}?`),
				)
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({ docs: responses[collection as keyof typeof responses] }),
				})
			}),
		)
		const onChange = vi.fn()

		render(createElement(VectorLayerEditor, { name: 'Vector', override: {}, onChange }))

		await waitFor(() => expect(screen.getByRole('option', { name: 'Wordmark' })).toBeTruthy())
		fireEvent.change(screen.getByLabelText('브랜드 내부 자산'), {
			target: { value: 'brand-logos:7' },
		})
		fireEvent.click(screen.getByRole('radio', { name: 'Contain' }))
		fireEvent.click(screen.getByRole('button', { name: 'Primary #112233' }))

		expect(onChange).toHaveBeenNthCalledWith(1, {
			vectorAsset: { collection: 'brand-logos', id: 7, src: '/logo.svg' },
		})
		expect(onChange).toHaveBeenNthCalledWith(2, { vectorFit: 'contain' })
		expect(onChange).toHaveBeenNthCalledWith(3, { vectorColor: '#112233' })
	})
})
