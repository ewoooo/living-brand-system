import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ControllerGroupDefinition } from '@/modules/studio-controller/controller-definition'
import { ControllerControlRenderer, ControllerRenderer } from './controller-renderer'

afterEach(cleanup)

describe('ControllerRenderer', () => {
	it('모든 그룹을 접을 수 있고 첫 그룹만 상단 구분선을 제거한다', () => {
		const groups = [
			{
				id: 'first',
				title: 'First',
				controls: [
					{ id: 'first-value', kind: 'text', label: 'First value', defaultValue: '' },
				],
			},
			{
				id: 'second',
				title: 'Second',
				controls: [
					{ id: 'second-value', kind: 'text', label: 'Second value', defaultValue: '' },
				],
			},
		] satisfies readonly ControllerGroupDefinition[]

		const { container } = render(
			<ControllerRenderer groups={groups} values={{}} onChange={vi.fn()} />,
		)
		const renderedGroups = container.querySelectorAll('[data-slot="controller-group"]')

		expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument()
		expect(renderedGroups[0]).toHaveClass('border-t-0')
		expect(renderedGroups[1]).toHaveClass('border-t')

		fireEvent.click(screen.getByRole('button', { name: 'First' }))
		expect(screen.queryByRole('textbox', { name: 'First value' })).toBeNull()
	})

	it('Published availability를 완화하지 않고 runtime 오류와 Pad 비율을 결합한다', () => {
		const onChange = vi.fn()
		const groups = [
			{
				id: 'controls',
				title: 'Controls',
				controls: [
					{
						id: 'published-readonly',
						kind: 'toggle',
						label: 'Published readonly',
						defaultValue: true,
						availability: 'readonly',
					},
					{
						id: 'runtime-disabled',
						kind: 'toggle',
						label: 'Runtime disabled',
						defaultValue: false,
					},
					{
						id: 'origin',
						kind: 'pad',
						label: 'Origin',
						defaultValue: { x: 0, y: 0 },
						aspectRatio: 1,
					},
				],
			},
		] satisfies readonly ControllerGroupDefinition[]

		render(
			<ControllerRenderer
				groups={groups}
				values={{}}
				bindings={{
					'published-readonly': { availability: 'enabled' },
					'runtime-disabled': {
						availability: 'disabled',
						error: '새 계약에서 허용하지 않는 값입니다.',
					},
					origin: { padAspectRatio: 16 / 9 },
				}}
				onChange={onChange}
			/>,
		)

		const readonlyRow = screen
			.getByText('Published readonly')
			.closest('[data-slot=controller-row]')
		expect(readonlyRow).not.toBeNull()
		expect(within(readonlyRow as HTMLElement).getByText('On')).toBeInTheDocument()
		expect(within(readonlyRow as HTMLElement).queryByRole('radio')).not.toBeInTheDocument()
		const disabled = screen.getByRole('radio', { name: 'Off' })
		expect(disabled).toBeDisabled()
		fireEvent.click(disabled)
		expect(onChange).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toHaveTextContent('새 계약에서 허용하지 않는 값입니다.')
		expect(screen.getByRole('slider', { name: 'Origin' })).toHaveStyle({
			aspectRatio: '1.7777777777777777',
		})
	})

	it('group 없이 단일 control에도 같은 runtime binding을 적용한다', () => {
		const onChange = vi.fn()
		render(
			<ControllerControlRenderer
				definition={{
					id: 'prompt',
					kind: 'text',
					label: 'Prompt',
					defaultValue: '',
					availability: 'readonly',
				}}
				value="입력 유지"
				binding={{
					availability: 'enabled',
					error: '최대 길이를 초과했습니다.',
				}}
				onChange={onChange}
			/>,
		)

		expect(screen.getByText('입력 유지')).toBeInTheDocument()
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		expect(screen.getByRole('alert')).toHaveTextContent('최대 길이를 초과했습니다.')
	})
})
