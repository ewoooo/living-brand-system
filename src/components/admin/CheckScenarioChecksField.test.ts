import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ComponentProps, createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CheckScenarioChecksField from './CheckScenarioChecksField'

const { setValue } = vi.hoisted(() => ({ setValue: vi.fn() }))

vi.mock('@payloadcms/ui', () => ({
	Button: (
		props: ComponentProps<'button'> & {
			buttonStyle?: string
			margin?: boolean
			size?: string
		},
	) =>
		createElement(
			'button',
			{
				'aria-label': props['aria-label'],
				disabled: props.disabled,
				onClick: props.onClick,
				type: props.type ?? 'button',
			},
			props.children,
		),
	FieldDescription: ({ description }: { description: string }) =>
		createElement('p', null, description),
	FieldError: () => null,
	FieldLabel: ({ htmlFor, label }: { htmlFor: string; label: string }) =>
		createElement('label', { htmlFor }, label),
	useField: () => ({
		disabled: false,
		errorMessage: '',
		setValue,
		showError: false,
		value: ['color.palette'],
	}),
}))

afterEach(() => {
	vi.unstubAllGlobals()
	setValue.mockClear()
})

describe('CheckScenarioChecksField', () => {
	it('선택된 Check와 추가 가능한 Check를 테이블로 표시한다', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					docs: [
						{
							key: 'color.palette',
							title: '브랜드 컬러 팔레트',
							documentTitle: 'Color Palette',
							tier: 'required',
							executor: 'deterministic',
						},
						{
							key: 'logo.geometry',
							title: '로고 구성 사용',
							documentTitle: 'Incorrect Usage',
							tier: 'recommended',
							executor: 'manual',
						},
					],
				}),
			}),
		)

		render(createElement(CheckScenarioChecksField, { path: 'checkKeys' } as never))

		const selectedTable = screen.getByRole('table', { name: '포함된 Check' })
		expect(selectedTable).toHaveTextContent('color.palette')

		await waitFor(() => expect(screen.getByText('브랜드 컬러 팔레트')).toBeInTheDocument())
		expect(selectedTable).toHaveTextContent('브랜드 컬러 팔레트')
		expect(screen.getByRole('table', { name: '추가 가능한 Check' })).toHaveTextContent(
			'로고 구성 사용',
		)

		fireEvent.click(screen.getByRole('button', { name: '포함' }))
		expect(setValue).toHaveBeenCalledWith(['color.palette', 'logo.geometry'])
	})
})
