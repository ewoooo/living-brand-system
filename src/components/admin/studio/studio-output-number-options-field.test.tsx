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

function renderField() {
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
			label="최대 인쇄 해상도"
			options={[
				{ label: '72ppi', value: '72' },
				{ label: '150ppi', value: '150' },
			]}
			path="exportPolicy.print.allowedPpi"
			source="graphic"
		/>,
	)
}

describe('StudioOutputNumberOptionsField', () => {
	it('저장된 허용 목록의 최고값을 최대로 읽고, 낮은 최대를 고르면 그 이하만 담는다', () => {
		renderField()
		expect(screen.getByRole('radio', { name: '150ppi' })).toHaveAttribute(
			'aria-checked',
			'true',
		)
		fireEvent.click(screen.getByRole('radio', { name: '72ppi' }))
		expect(field.setValue).toHaveBeenCalledWith([72])
	})

	it('최고값을 고르면 제한을 저장하지 않는다(undefined)', () => {
		field.value = [72]
		renderField()
		fireEvent.click(screen.getByRole('radio', { name: '150ppi' }))
		expect(field.setValue).toHaveBeenCalledWith(undefined)
	})
})
