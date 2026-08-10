import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InspectorSection } from './inspector'

describe('InspectorSection', () => {
	afterEach(cleanup)

	it('잠금 중에도 사용자의 접힘 상태를 보존한다 — 풀려도 닫힌 채 남는다', () => {
		const { rerender } = render(
			<InspectorSection title="Sec">
				<div>내용물</div>
			</InspectorSection>,
		)
		expect(screen.getByText('내용물')).toBeInTheDocument()

		// 사용자가 접는다.
		fireEvent.click(screen.getByRole('button', { name: 'Sec' }))
		expect(screen.queryByText('내용물')).toBeNull()

		// 잠금 — 닫힘 유지 + 토글 불가.
		rerender(
			<InspectorSection title="Sec" disabled>
				<div>내용물</div>
			</InspectorSection>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeDisabled()
		expect(screen.queryByText('내용물')).toBeNull()

		// 잠금 해제 — 강제로 열지 않고 사용자가 접어둔 상태로 복귀한다.
		rerender(
			<InspectorSection title="Sec">
				<div>내용물</div>
			</InspectorSection>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeEnabled()
		expect(screen.queryByText('내용물')).toBeNull()
	})
})
