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
			label="사용할 인쇄 해상도"
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
	it('허용 목록을 다중 토글로 저장하고, 전부 켜면 undefined로 접는다', () => {
		renderField()
		expect(screen.getByRole('button', { name: '150ppi' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)
		fireEvent.click(screen.getByRole('button', { name: '72ppi' }))
		expect(field.setValue).toHaveBeenCalledWith(undefined)
	})

	it('하나를 끄면 남은 옵션만 담는다', () => {
		field.value = undefined
		renderField()
		fireEvent.click(screen.getByRole('button', { name: '150ppi' }))
		expect(field.setValue).toHaveBeenCalledWith([72])
	})
})
