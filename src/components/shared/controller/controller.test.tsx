import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

		expect(container.querySelector('[data-slot="controller-root"]')).toHaveClass(
			'overflow-hidden',
		)
		expect(container.querySelector('[data-slot="controller-header"]')).toHaveClass('shrink-0')
		expect(container.querySelector('[data-slot="controller-content"]')).toHaveClass(
			'min-h-0',
			'flex-1',
			'overflow-y-auto',
		)
		expect(container.querySelector('[data-slot="controller-group"]')).toBeInTheDocument()
		expect(screen.getByText('그룹')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '그룹' })).toBeInTheDocument()
		expect(container.querySelector('[data-slot="controller-footer"]')).toHaveClass('shrink-0')
	})
})

describe('Controller.Group', () => {
	afterEach(cleanup)

	it('항상 접고 펼칠 수 있고 닫힐 때 본문을 퇴장시킨다', async () => {
		const { container } = render(
			<Controller.Group title="Sec">
				<div>내용물</div>
			</Controller.Group>,
		)
		const content = container.querySelector('[data-slot="controller-group-content"]')

		fireEvent.click(screen.getByRole('button', { name: 'Sec' }))
		expect(screen.getByRole('button', { name: 'Sec' })).toHaveAttribute(
			'aria-expanded',
			'false',
		)
		await waitFor(() => expect(content).toHaveStyle({ height: '0px', opacity: '0' }))
	})

	it('잠금 중에도 사용자의 접힘 상태를 보존한다 — 풀려도 닫힌 채 남는다', async () => {
		const { container, rerender } = render(
			<Controller.Group title="Sec">
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByText('내용물')).toBeInTheDocument()

		// 사용자가 접는다.
		fireEvent.click(screen.getByRole('button', { name: 'Sec' }))
		await waitFor(() =>
			expect(container.querySelector('[data-slot="controller-group-content"]')).toHaveStyle({
				height: '0px',
				opacity: '0',
			}),
		)

		// 잠금 — 닫힘 유지 + 토글 불가.
		rerender(
			<Controller.Group title="Sec" disabled>
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Sec' })).toHaveAttribute(
			'aria-expanded',
			'false',
		)

		// 잠금 해제 — 강제로 열지 않고 사용자가 접어둔 상태로 복귀한다.
		rerender(
			<Controller.Group title="Sec">
				<div>내용물</div>
			</Controller.Group>,
		)
		expect(screen.getByRole('button', { name: 'Sec' })).toBeEnabled()
		expect(screen.getByRole('button', { name: 'Sec' })).toHaveAttribute(
			'aria-expanded',
			'false',
		)
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

	it('Segmented 체이서는 활성 버튼의 실제 폭을 따라 이동한다', () => {
		const options = [
			{ value: 'short', label: 'On' },
			{ value: 'long', label: 'Generate' },
		] as const
		const { container, rerender } = render(
			<Controller.Segmented
				aria-label="모드"
				options={options}
				value="short"
				onChange={vi.fn()}
			/>,
		)

		expect(
			container.querySelector('[data-slot="controller-segmented-pill"]')?.parentElement,
		).toHaveTextContent('On')

		rerender(
			<Controller.Segmented
				aria-label="모드"
				options={options}
				value="long"
				onChange={vi.fn()}
			/>,
		)
		expect(
			container.querySelector('[data-slot="controller-segmented-pill"]')?.parentElement,
		).toHaveTextContent('Generate')
	})

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

	it('Range는 임계 안에서 뗀 클릭은 뗀 지점만, 드래그는 이동마다 반영한다', () => {
		const onChange = vi.fn()
		render(
			<Controller.Range
				label="Scale"
				value={0}
				min={0}
				max={10}
				step={1}
				onChange={onChange}
			/>,
		)
		const track = screen.getByRole('slider', { name: 'Scale' })
		// jsdom에는 레이아웃이 없다 — 비율 환산의 기준 사각형만 실측처럼 세운다.
		vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			top: 0,
			width: 100,
			height: 36,
			right: 100,
			bottom: 36,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		} as DOMRect)

		// 클릭: 누른 순간에는 값이 움직이지 않고, 임계(3px) 안의 손떨림도 드래그가 되지 않는다.
		fireEvent.pointerDown(track, { clientX: 30, clientY: 18, button: 0 })
		expect(onChange).not.toHaveBeenCalled()
		fireEvent.pointerMove(track, { clientX: 31, clientY: 18 })
		expect(onChange).not.toHaveBeenCalled()
		fireEvent.pointerUp(track, { clientX: 31, clientY: 18 })
		expect(onChange.mock.calls).toEqual([[3]])

		// 드래그: 임계를 넘긴 뒤로는 이동마다 값이 따라온다.
		onChange.mockClear()
		fireEvent.pointerDown(track, { clientX: 30, clientY: 18, button: 0 })
		fireEvent.pointerMove(track, { clientX: 60, clientY: 18 })
		fireEvent.pointerMove(track, { clientX: 80, clientY: 18 })
		fireEvent.pointerUp(track, { clientX: 80, clientY: 18 })
		expect(onChange.mock.calls).toEqual([[6], [8]])
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

describe('Controller.AssetCard', () => {
	afterEach(cleanup)

	function renderAssetCard(disabled = false, previewImage?: { url: string; alt: string }) {
		return render(
			<Controller.Browser.Root>
				<Controller.AssetCard
					title="제품컷"
					subtitle="Brand Image"
					buttonLabel="Change"
					aria-label="프로파일 변경"
					tabs={['Image Profiles']}
					previewImage={previewImage}
					disabled={disabled}
				>
					<div>고를 것들</div>
				</Controller.AssetCard>
			</Controller.Browser.Root>,
		)
	}

	it('현재 값·출처·열기 버튼을 그리고, 버튼 이름은 무엇을 여는지 말한다', () => {
		renderAssetCard()

		expect(screen.getByText('제품컷')).toBeInTheDocument()
		expect(screen.getByText('Brand Image')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '프로파일 변경' })).toHaveTextContent('Change')
	})

	it('버튼으로 브라우저 패널이 열리고 본문은 소비자가 준 것이다', () => {
		renderAssetCard()
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: '프로파일 변경' }))

		const panel = screen.getByRole('dialog', { name: 'Image Profiles' })
		expect(panel).toHaveTextContent('고를 것들')
	})

	// 배경 이미지는 장식이다 — 카드가 무엇인지는 제목이 말하므로 접근성 트리에 이름을 하나 더 넣지 않는다.
	it('미리보기 이미지가 있으면 카드 배경으로 깔고 접근성 트리에서는 감춘다', () => {
		const { container } = renderAssetCard(false, { url: '/media/preview.png', alt: '무시됨' })

		const background = container.querySelector('img')
		expect(background).toHaveAttribute('src', '/media/preview.png')
		expect(background).toHaveAttribute('alt', '')
		expect(background).toHaveAttribute('aria-hidden', 'true')
	})

	it('미리보기 이미지가 없으면 배경 이미지를 두지 않는다', () => {
		const { container } = renderAssetCard()

		expect(container.querySelector('img')).toBeNull()
	})

	// 배선 전 카드는 트리거 자체를 두지 않는다 — 열리는 척하는 컨트롤을 만들지 않기 위해서다.
	it('잠긴 카드는 눌러도 패널이 열리지 않는다', () => {
		renderAssetCard(true)

		const button = screen.getByRole('button', { name: '프로파일 변경' })
		expect(button).toBeDisabled()
		fireEvent.click(button)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
})

describe('Controller.Browser.Thumbnail', () => {
	afterEach(cleanup)

	// 브라우저 카드의 미리보기는 장식이 아니다 — 이름이 말해주지 않는 "무엇처럼 생겼나"를 전하므로
	// 어드민이 등록한 alt를 그대로 쓴다.
	it('이미지가 있으면 어드민 alt와 함께 그리고, 없으면 빈 표면만 남는다', () => {
		const withImage = render(
			<Controller.Browser.Thumbnail image={{ url: '/media/card.png', alt: '방사형 광선' }} />,
		)
		expect(screen.getByRole('img', { name: '방사형 광선' })).toHaveAttribute(
			'src',
			'/media/card.png',
		)
		withImage.unmount()

		const { container } = render(<Controller.Browser.Thumbnail />)
		expect(container.querySelector('img')).toBeNull()
		expect(container.querySelector('[data-slot="controller-browser-thumbnail"]')).not.toBeNull()
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
