import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { BackgroundSection } from './background-section'

/** Type 셀렉트를 키보드로 열어 옵션을 고른다 — jsdom엔 pointer capture가 없어 클릭으로 못 연다. */
async function selectBackgroundType(user: ReturnType<typeof userEvent.setup>, option: string) {
	screen.getByRole('combobox', { name: 'Type' }).focus()
	await user.keyboard('{ArrowDown}')
	await user.click(screen.getByRole('option', { name: option }))
}

describe('BackgroundSection', () => {
	afterEach(cleanup)

	it('기본 Color 타입은 배경색 행만 보여준다', () => {
		render(<BackgroundSection allowedTypes={['color', 'image', 'graphic']} />)

		expect(screen.getByLabelText('Background Color 색상 선택')).toBeInTheDocument()
		expect(screen.queryByRole('radio', { name: 'Preset' })).toBeNull()
	})

	it('Image 타입은 Preset·Generate 세그먼트로 하위 컨트롤을 갈아끼운다', async () => {
		const user = userEvent.setup()
		render(<BackgroundSection allowedTypes={['color', 'image', 'graphic']} />)
		await selectBackgroundType(user, 'Image')

		// Preset 기본: 브라우즈 카드가 보이고 프롬프트는 없다.
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()
		expect(screen.queryByLabelText('Prompt')).toBeNull()

		await user.click(screen.getByRole('radio', { name: 'Generate' }))
		// 탭 전환은 exit 애니메이션 후 콘텐츠가 들어온다(InspectorTabPanel mode="wait").
		expect(await screen.findByLabelText('Prompt')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '이미지 생성' })).toBeDisabled()
	})

	it('활성 세그먼트 재클릭은 선택을 비우지 않는다', async () => {
		const user = userEvent.setup()
		render(<BackgroundSection allowedTypes={['color', 'image', 'graphic']} />)
		await selectBackgroundType(user, 'Image')

		// radix ToggleGroup은 재클릭에 빈 값을 내보낸다 — 가드가 없으면 두 탭 패널이 모두 사라진다.
		await user.click(screen.getByRole('radio', { name: 'Preset' }))
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()
	})

	it('계약이 허용한 배경 종류만 Type 목록에 오르고, 첫 허용 종류가 기본값이 된다', async () => {
		const user = userEvent.setup()
		render(<BackgroundSection allowedTypes={['image', 'graphic']} />)

		// 기본값이 color가 아니라 첫 허용 종류(image) — Preset 브라우즈 카드가 바로 보인다.
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		expect(screen.queryByRole('option', { name: 'Color' })).toBeNull()
		expect(screen.getByRole('option', { name: 'Graphic' })).toBeInTheDocument()
	})

	it('Graphic 타입은 forward-straight가 지원하는 컨트롤만 노출한다', async () => {
		const user = userEvent.setup()
		render(<BackgroundSection allowedTypes={['color', 'image', 'graphic']} />)
		await selectBackgroundType(user, 'Graphic')

		expect(screen.getByRole('radio', { name: 'Off' })).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: '그래픽 위치' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Perspective' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Angle' })).toBeInTheDocument()
	})
})
