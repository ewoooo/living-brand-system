import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	InspectorCameraControl,
	InspectorField,
	InspectorRow,
	InspectorSection,
	InspectorSegmented,
} from './inspector'

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

describe('InspectorRow', () => {
	afterEach(cleanup)

	it('disabled 행은 흐려지고 aria-disabled로 노출된다 — 어드민 고정(Admin Fixed) 상태', () => {
		render(
			<InspectorRow label="Toggle" disabled data-testid="row">
				<span>On</span>
			</InspectorRow>,
		)
		const row = screen.getByTestId('row')
		expect(row).toHaveAttribute('aria-disabled', 'true')
		expect(row.className).toContain('opacity-50')
		expect(row.className).toContain('pointer-events-none')
	})

	it('아이콘 라벨은 sr-only 텍스트로 접근 가능한 이름을 동반한다 — 컨트롤러 API label 계약', () => {
		render(
			<InspectorRow
				label={
					<>
						<svg aria-hidden className="size-6" />
						<span className="sr-only">Quality</span>
					</>
				}
			>
				<span>High</span>
			</InspectorRow>,
		)
		expect(screen.getByText('Quality')).toBeInTheDocument()
	})
})

describe('InspectorSegmented', () => {
	afterEach(cleanup)

	it('disabled면 세그먼트 조작이 막힌다', () => {
		render(
			<InspectorSegmented
				aria-label="가변 두께"
				options={[
					{ value: 'off', label: 'Off' },
					{ value: 'on', label: 'On' },
				]}
				value="off"
				onChange={vi.fn()}
				disabled
			/>,
		)
		expect(screen.getByRole('radio', { name: 'On' })).toBeDisabled()
		expect(screen.getByRole('radio', { name: 'Off' })).toBeDisabled()
	})
})

describe('InspectorField', () => {
	afterEach(cleanup)

	it('counter가 라벨 행에 표시된다 — maxStringLength 계약의 표시부', () => {
		render(
			<InspectorField label="Prompt" counter="190/250">
				<textarea />
			</InspectorField>,
		)
		expect(screen.getByText('190/250')).toBeInTheDocument()
	})
})

describe('InspectorCameraControl', () => {
	afterEach(cleanup)

	it('정사각 프리뷰 슬롯과 축 셀렉트를 그린다 — 프리뷰 렌더러는 소비자 소유', () => {
		render(
			<InspectorCameraControl
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
			</InspectorCameraControl>,
		)
		expect(screen.getByTestId('orbit-preview')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'X' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Y' })).toBeInTheDocument()
	})
})
