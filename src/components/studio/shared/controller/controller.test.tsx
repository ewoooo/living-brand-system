import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Controller } from './index'

describe('Controller layout', () => {
	afterEach(cleanup)

	it('Root 아래 Header·Content·Group·Footer를 명시적으로 조합한다', () => {
		const { container } = render(
			<Controller.Root>
				<Controller.Header>헤더</Controller.Header>
				<Controller.Content>
					<Controller.Group title="그룹">
						<div>컨트롤</div>
					</Controller.Group>
				</Controller.Content>
				<Controller.Footer>실행</Controller.Footer>
			</Controller.Root>,
		)

		expect(container.querySelector('[data-slot="controller-root"]')).toBeInTheDocument()
		expect(container.querySelector('[data-slot="controller-header"]')).toBeInTheDocument()
		expect(container.querySelector('[data-slot="controller-content"]')).toBeInTheDocument()
		expect(container.querySelector('[data-slot="controller-group"]')).toBeInTheDocument()
		expect(screen.getByText('그룹')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: '그룹' })).toBeNull()
		expect(container.querySelector('[data-slot="controller-footer"]')).toBeInTheDocument()
	})
})

describe('Controller.Group collapsible', () => {
	afterEach(cleanup)

	it('잠금 중에도 사용자의 접힘 상태를 보존한다 — 풀려도 닫힌 채 남는다', () => {
		const { rerender } = render(
			<Controller.Group title="Sec" collapsible>
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByText('내용물')).toBeInTheDocument()

		// 사용자가 접는다.
		fireEvent.click(screen.getByRole('button', { name: 'Sec' }))
		expect(screen.queryByText('내용물')).toBeNull()

		// 잠금 — 닫힘 유지 + 토글 불가.
		rerender(
			<Controller.Group title="Sec" collapsible disabled>
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeDisabled()
		expect(screen.queryByText('내용물')).toBeNull()

		// 잠금 해제 — 강제로 열지 않고 사용자가 접어둔 상태로 복귀한다.
		rerender(
			<Controller.Group title="Sec" collapsible>
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeEnabled()
		expect(screen.queryByText('내용물')).toBeNull()
	})
})

describe('Controller.Row', () => {
	afterEach(cleanup)

	it('안의 킷 컨트롤은 라벨 연결 id를 자동으로 이어받는다 — 수동 htmlFor 배선 없음', () => {
		render(
			<Controller.Row label="Perspective">
				<Controller.Select
					options={[{ value: 'flat', label: 'Flat' }]}
					value="flat"
					onChange={vi.fn()}
				/>
			</Controller.Row>,
		)
		// 라벨 텍스트가 곧 셀렉트의 접근 가능한 이름이 된다.
		expect(screen.getByRole('combobox', { name: 'Perspective' })).toBeInTheDocument()
	})

	it('disabled 행은 흐려지고 안의 컨트롤도 컨텍스트로 함께 비활성된다 — Admin Fixed 상태', () => {
		render(
			<Controller.Row label="Toggle" disabled data-testid="row">
				<Controller.Segmented
					aria-label="가변 두께"
					options={[
						{ value: 'off', label: 'Off' },
						{ value: 'on', label: 'On' },
					]}
					value="off"
					onChange={vi.fn()}
				/>
			</Controller.Row>,
		)
		const row = screen.getByTestId('row')
		expect(row).toHaveAttribute('aria-disabled', 'true')
		expect(row.className).toContain('opacity-50')
		expect(row.className).toContain('pointer-events-none')
		// disabled를 세그먼트에 다시 전달하지 않아도 컨텍스트가 막는다.
		expect(screen.getByRole('radio', { name: 'On' })).toBeDisabled()
	})

	it('readonly 행은 라벨이 span이라 죽은 label 클릭 어포던스를 만들지 않는다', () => {
		render(
			<Controller.Row label="Size" readonly>
				<span>210 × 297mm</span>
			</Controller.Row>,
		)
		expect(screen.getByText('Size').tagName).toBe('SPAN')
	})

	it('아이콘 라벨은 sr-only 텍스트로 접근 가능한 이름을 동반한다 — 컨트롤러 API label 계약', () => {
		render(
			<Controller.Row
				label={
					<>
						<svg aria-hidden className="size-6" />
						<span className="sr-only">Quality</span>
					</>
				}
				readonly
			>
				<span>High</span>
			</Controller.Row>,
		)
		expect(screen.getByText('Quality')).toBeInTheDocument()
	})
})

describe('Controller.Field', () => {
	afterEach(cleanup)

	it('counter가 라벨 행에 표시되고, 안의 Textarea는 라벨과 자동 연결된다', () => {
		render(
			<Controller.Field label="Prompt" counter="190/250">
				<Controller.Textarea />
			</Controller.Field>,
		)
		expect(screen.getByText('190/250')).toBeInTheDocument()
		expect(screen.getByLabelText('Prompt')).toBeInTheDocument()
	})

	it('disabled를 안의 입력까지 전달한다', () => {
		render(
			<Controller.Field label="Prompt" disabled data-testid="field">
				<Controller.Textarea />
			</Controller.Field>,
		)
		expect(screen.getByTestId('field')).toHaveAttribute('aria-disabled', 'true')
		expect(screen.getByLabelText('Prompt')).toBeDisabled()
	})
})

describe('Controller value controls', () => {
	afterEach(cleanup)

	it('Range는 화살표 키로 계약의 step만큼 값을 바꾼다', () => {
		const onChange = vi.fn()
		render(
			<Controller.Range
				label="Scale"
				value={1}
				min={0.2}
				max={5}
				step={0.05}
				onChange={onChange}
			/>,
		)

		fireEvent.keyDown(screen.getByRole('slider', { name: 'Scale' }), { key: 'ArrowRight' })
		expect(onChange).toHaveBeenCalledWith(1.05)
	})

	it('Pad는 화살표 키로 x·y 단위 객체를 갱신한다', () => {
		const onChange = vi.fn()
		render(
			<Controller.Pad aria-label="그래픽 위치" value={{ x: 0, y: 0 }} onChange={onChange} />,
		)

		fireEvent.keyDown(screen.getByRole('slider', { name: '그래픽 위치' }), {
			key: 'ArrowDown',
		})
		expect(onChange).toHaveBeenCalledWith({ x: 0, y: 0.05 })
	})
})

describe('Controller.CameraControl', () => {
	afterEach(cleanup)

	it('정사각 프리뷰 슬롯과 축 셀렉트를 그린다 — 프리뷰 렌더러는 소비자 소유', () => {
		render(
			<Controller.CameraControl
				axes={[
					{
						label: 'X',
						options: [{ value: 'front', label: 'Front' }],
						value: 'front',
						onChange: vi.fn(),
					},
					{
						label: 'Y',
						options: [{ value: 'front', label: 'Front' }],
						value: 'front',
						onChange: vi.fn(),
					},
				]}
			>
				<div data-testid="orbit-preview" />
			</Controller.CameraControl>,
		)
		expect(screen.getByTestId('orbit-preview')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'X' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Y' })).toBeInTheDocument()
	})
})
