import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StudioOutputFormatsField } from './studio-output-formats-field'

const payloadForm = vi.hoisted(() => ({
	fields: {
		runtime: { value: 'sample' },
	},
	setValue: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => ({
	FieldDescription: ({ description }: { description: string }) =>
		createElement('p', null, description),
	FieldError: () => null,
	FieldLabel: ({ label }: { label: string }) => createElement('legend', null, label),
	useField: () => ({
		disabled: false,
		errorMessage: '',
		setValue: payloadForm.setValue,
		showError: false,
		value: ['png', 'mp4'],
	}),
	useFormFields: (select: (state: [typeof payloadForm.fields]) => unknown) =>
		select([payloadForm.fields]),
}))

afterEach(() => {
	cleanup()
	payloadForm.setValue.mockClear()
})

describe('StudioOutputFormatsField', () => {
	it('선택한 Runtime Artifact가 지원하는 형식만 보이고 기존 제한도 같은 범위로 줄인다', async () => {
		render(
			createElement(StudioOutputFormatsField, {
				path: 'exportPolicy.allowedFormats',
				source: 'graphic',
				baseConfigs: [
					{
						id: 'sample',
						artifacts: { raster: {} },
						controller: { groups: [] },
					},
				],
			} as never),
		)

		expect(screen.getByRole('checkbox', { name: 'PNG' })).toBeInTheDocument()
		expect(screen.queryByRole('checkbox', { name: 'SVG' })).not.toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'MP4' })).toBeInTheDocument()
		await waitFor(() => expect(payloadForm.setValue).not.toHaveBeenCalled())
	})

	it('Template Raster capability에서 인쇄와 영상 형식을 함께 계산한다', () => {
		render(
			createElement(StudioOutputFormatsField, {
				path: 'exportPolicy.allowedFormats',
				source: 'template',
			} as never),
		)

		expect(screen.getByRole('checkbox', { name: 'PNG' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'JPEG' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'TIFF' })).toBeInTheDocument()
		expect(screen.getByRole('checkbox', { name: 'PDF' })).toBeInTheDocument()
	})
})
