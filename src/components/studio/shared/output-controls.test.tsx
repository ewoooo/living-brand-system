import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SizingControls } from './output-controls'

/** 300dpi 기준 mm→px. 디자이너 원본과 같은 상수(`dpi / 25.4`)다. */
const PX_PER_MM = 300 / 25.4

function widthInput() {
	return screen.getByRole('spinbutton', { name: 'Width' })
}

/** Segmented는 같은 이름의 radio를 둘 이상 그린다(pill 측정용 사본) — 첫 번째가 실제 트리거다. */
function unitRadio(name: 'px' | 'mm') {
	return screen.getAllByRole('radio', { name })[0]
}

afterEach(cleanup)

describe('SizingControls 단위 전환', () => {
	it('px가 기본이고 저장된 값을 그대로 보여준다', () => {
		render(<SizingControls value={{ width: 2480, height: 3508 }} onChange={vi.fn()} />)

		expect(unitRadio('px')).toHaveAttribute('aria-checked', 'true')
		expect(widthInput()).toHaveValue(2480)
	})

	it('mm로 바꾸면 표시만 환산하고 저장값은 건드리지 않는다', () => {
		const onChange = vi.fn()
		render(<SizingControls value={{ width: 2480, height: 3508 }} onChange={onChange} />)

		fireEvent.click(unitRadio('mm'))

		expect(widthInput()).toHaveValue(Math.round(2480 / PX_PER_MM)) // 210
		// 🔴 단위를 바꾸는 것만으로는 값이 바뀌지 않는다 — 보는 방식만 바꾼 것이다.
		expect(onChange).not.toHaveBeenCalled()
	})

	it('mm로 입력하면 px로 환산해 올려준다', () => {
		const onChange = vi.fn()
		render(<SizingControls value={{ width: 1103, height: 1246 }} onChange={onChange} />)

		fireEvent.click(unitRadio('mm'))
		fireEvent.blur(widthInput(), { target: { value: '210' } })

		// 210mm × (300/25.4) = 2480.31 → 2480
		expect(onChange).toHaveBeenCalledWith({ width: 2480, height: 1246 })
	})

	it('표시 반올림이 손대지 않은 축의 저장값을 오염시키지 않는다', () => {
		// mm 표시는 정수로 깎이지만(1246px → 105mm), 편집하지 않은 축은 px 원본이 그대로 올라간다.
		const onChange = vi.fn()
		render(<SizingControls value={{ width: 1103, height: 1246 }} onChange={onChange} />)

		fireEvent.click(unitRadio('mm'))
		fireEvent.blur(widthInput(), { target: { value: '210' } })

		expect(onChange.mock.calls[0][0].height).toBe(1246)
	})

	it('최대값도 같은 단위로 환산해 비교한다', () => {
		// px 상한 2000은 mm에서 169다 — 환산하지 않으면 mm로 170을 넣어도 통과해 상한이 새 버린다.
		const onChange = vi.fn()
		render(
			<SizingControls
				value={{ width: 1000, height: 1000 }}
				maxWidth={2000}
				maxHeight={2000}
				onChange={onChange}
			/>,
		)

		fireEvent.click(unitRadio('mm'))
		fireEvent.blur(widthInput(), { target: { value: '170' } })

		expect(onChange).not.toHaveBeenCalled()
	})
})
