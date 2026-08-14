import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StudioOutputNumberOptionsField } from './studio-output-number-options-field'

const field = vi.hoisted(() => ({ setValue: vi.fn(), value: [150] as number[] | undefined }))
const form = vi.hoisted(() => ({ fields: { runtime: { value: 'sample' } } }))

vi.mock('@payloadcms/ui', () => ({
	FieldDescription: () => null,
	FieldError: () => null,
	FieldLabel: ({ label }: { label: string }) => createElement('legend', null, label),
	useField: () => ({
		disabled: false,
		errorMessage: '',
		setValue: field.setValue,
		showError: false,
		value: field.value,
	}),
	useFormFields: (select: (state: [typeof form.fields]) => unknown) => select([form.fields]),
}))

afterEach(() => {
	cleanup()
	field.setValue.mockClear()
	field.value = [150]
})

describe('StudioOutputNumberOptionsField', () => {
	it('숫자 option을 JSON number[] 제한으로 저장한다', () => {
		render(
			<StudioOutputNumberOptionsField
				baseConfigs={[
					{
						id: 'sample',
						artifacts: { raster: {} },
						controller: { groups: [] },
					},
				]}
				kind="print"
				label="허용 PPI"
				options={[
					{ label: '72ppi', value: '72' },
					{ label: '150ppi', value: '150' },
				]}
				path="exportPolicy.print.allowedPpi"
				source="graphic"
			/>,
		)
		expect(screen.getByRole('checkbox', { name: '150ppi' })).toBeChecked()
		fireEvent.click(screen.getByRole('checkbox', { name: '72ppi' }))
		expect(field.setValue).toHaveBeenCalledWith(undefined)
	})
})
