import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StudioExportPolicyField } from './studio-export-policy-field'

type FieldState = { value: unknown; setValue: ReturnType<typeof vi.fn> }

const fields = vi.hoisted(() => new Map<string, FieldState>())
const form = vi.hoisted(() => ({ fields: { runtime: { value: 'sample' } } }))

function fieldState(path: string): FieldState {
	const existing = fields.get(path)
	if (existing) return existing
	const created = { value: undefined, setValue: vi.fn() }
	fields.set(path, created)
	return created
}

vi.mock('@payloadcms/ui', () => ({
	FieldLabel: ({ label }: { label: string }) => createElement('legend', null, label),
	useField: ({ path }: { path: string }) => ({
		disabled: false,
		errorMessage: '',
		showError: false,
		...fieldState(path),
	}),
	useFormFields: (select: (state: [typeof form.fields]) => unknown) => select([form.fields]),
}))

afterEach(() => {
	cleanup()
	fields.clear()
})

function renderField() {
	render(
		createElement(StudioExportPolicyField, {
			baseConfigs: [
				{
					id: 'sample',
					artifacts: { raster: {} },
					controller: { groups: [] },
				},
			],
			path: 'exportPolicy',
			source: 'graphic',
		}),
	)
}

describe('StudioExportPolicyField', () => {
	it('형식 범주 토글이 그 범주의 지원 형식 목록을 저장한다', () => {
		renderField()
		// raster artifact → png·jpeg(래스터)·tiff·pdf(인쇄)·mp4(영상, 래스터 파생) 지원, 벡터만 숨는다.
		expect(screen.queryByRole('button', { name: '벡터' })).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: '래스터' }))
		expect(fieldState('exportPolicy.allowedFormats').setValue).toHaveBeenCalledWith([
			'tiff',
			'pdf',
			'mp4',
		])
	})

	it('인쇄 해상도 허용 목록을 다중 토글로 저장한다', () => {
		fieldState('exportPolicy.print.allowedPpi').value = [72]
		renderField()
		fireEvent.click(screen.getByRole('button', { name: '150ppi' }))
		expect(fieldState('exportPolicy.print.allowedPpi').setValue).toHaveBeenCalledWith([72, 150])
	})

	it('전부 켜면 제한을 저장하지 않는다(undefined)', () => {
		fieldState('exportPolicy.print.allowedPpi').value = [72, 150]
		renderField()
		fireEvent.click(screen.getByRole('button', { name: '300ppi' }))
		expect(fieldState('exportPolicy.print.allowedPpi').setValue).toHaveBeenCalledWith(undefined)
	})
})
