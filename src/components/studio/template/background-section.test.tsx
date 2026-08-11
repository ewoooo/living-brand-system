import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TemplateBackgroundState } from '@/features/template-studio/hooks/use-template-studio'
import type { TemplateBackgroundType } from '@/features/template-studio/template-config'
import { BackgroundSection } from './background-section'

const mocks = vi.hoisted(() => ({ requestImageGeneration: vi.fn() }))
vi.mock('@/features/generate-image/services/generate-image.client', () => ({
	requestImageGeneration: mocks.requestImageGeneration,
}))

const profiles = [
	{ id: 3, name: '첫 프로파일' },
	{ id: 4, name: '두 번째 프로파일' },
]

/** 배경 상태의 소유자는 Provider다 — 테스트에서는 같은 계약(값+patch)의 껍데기가 대신 쥔다. */
function Harness({
	allowedTypes,
	onChange,
	...props
}: {
	allowedTypes: readonly TemplateBackgroundType[]
	onChange?: (patch: Partial<TemplateBackgroundState>) => void
	profiles?: typeof profiles | null
	profilesFailed?: boolean
	aspectRatio?: '4:3'
}) {
	const [state, setState] = useState<TemplateBackgroundState>({
		type: allowedTypes[0] ?? 'color',
		imageMode: 'preset',
		color: null,
	})
	return (
		<BackgroundSection
			allowedTypes={allowedTypes}
			profiles={props.profiles === undefined ? profiles : props.profiles}
			profilesFailed={props.profilesFailed}
			aspectRatio={props.aspectRatio}
			value={state}
			onChange={(patch) => {
				onChange?.(patch)
				setState((current) => ({ ...current, ...patch }))
			}}
		/>
	)
}

/** Type 셀렉트를 키보드로 열어 옵션을 고른다 — jsdom엔 pointer capture가 없어 클릭으로 못 연다. */
async function selectBackgroundType(user: ReturnType<typeof userEvent.setup>, option: string) {
	screen.getByRole('combobox', { name: 'Type' }).focus()
	await user.keyboard('{ArrowDown}')
	await user.click(screen.getByRole('option', { name: option }))
}

/** Generate 탭으로 옮긴다 — 탭 스왑은 AnimatePresence mode="wait"라 이전 패널이 빠진 뒤 나타난다. */
async function openGenerateTab(user: ReturnType<typeof userEvent.setup>) {
	await selectBackgroundType(user, 'Image')
	await user.click(screen.getByRole('radio', { name: 'Generate' }))
	return await screen.findByLabelText('Prompt')
}

describe('BackgroundSection', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})
	afterEach(cleanup)

	it('기본 Color 타입은 배경색 행만 보여준다', () => {
		render(<Harness allowedTypes={['color', 'image', 'graphic']} />)

		expect(screen.getByLabelText('Background Color 색상 선택')).toBeInTheDocument()
		expect(screen.queryByRole('radio', { name: 'Preset' })).toBeNull()
	})

	it('Image 타입은 Preset·Generate 세그먼트로 하위 컨트롤을 갈아끼운다', async () => {
		const user = userEvent.setup()
		render(<Harness allowedTypes={['color', 'image', 'graphic']} />)
		await selectBackgroundType(user, 'Image')

		// Preset 기본: 브라우즈 카드가 보이고 프롬프트는 없다.
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()
		expect(screen.queryByLabelText('Prompt')).toBeNull()

		expect(await openGenerateTab(user)).toBeInTheDocument()
	})

	it('활성 세그먼트 재클릭은 선택을 비우지 않는다', async () => {
		const user = userEvent.setup()
		render(<Harness allowedTypes={['color', 'image', 'graphic']} />)
		await selectBackgroundType(user, 'Image')

		// radix ToggleGroup은 재클릭에 빈 값을 내보낸다 — 가드가 없으면 두 탭 패널이 모두 사라진다.
		await user.click(screen.getByRole('radio', { name: 'Preset' }))
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()
	})

	it('계약이 허용한 배경 종류만 Type 목록에 오르고, 첫 허용 종류가 기본값이 된다', async () => {
		const user = userEvent.setup()
		render(<Harness allowedTypes={['image', 'graphic']} />)

		// 기본값이 color가 아니라 첫 허용 종류(image) — Preset 브라우즈 카드가 바로 보인다.
		expect(screen.getByText('이미지를 선택하세요')).toBeInTheDocument()

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		expect(screen.queryByRole('option', { name: 'Color' })).toBeNull()
		expect(screen.getByRole('option', { name: 'Graphic' })).toBeInTheDocument()
	})

	it('배경색은 만졌을 때만 값이 되고 초기화로 되돌린다', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		render(<Harness allowedTypes={['color']} onChange={onChange} />)

		// 만지기 전 — 저작 배경을 사칭하지 않는다.
		expect(screen.getByText('—')).toBeInTheDocument()

		// 네이티브 컬러 피커는 타이핑으로 값을 못 바꾼다 — 변경 이벤트를 직접 쏜다.
		fireEvent.change(screen.getByLabelText('Background Color 색상 선택'), {
			target: { value: '#ff0000' },
		})
		expect(onChange).toHaveBeenLastCalledWith({ color: '#ff0000' })
		expect(screen.getByText('#ff0000')).toBeInTheDocument()

		await user.click(
			screen.getByRole('button', { name: 'Background Color 원래 색으로 되돌리기' }),
		)
		expect(onChange).toHaveBeenLastCalledWith({ color: null })
	})

	it('배경 생성은 발행 목록 첫 프로파일·캔버스 비율·1장으로 요청하고 결과를 배경으로 올린다', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 9, url: '/api/generated-images/file/canvas.png' }],
		})
		render(<Harness allowedTypes={['image']} aspectRatio="4:3" onChange={onChange} />)

		const promptField = await openGenerateTab(user)
		// 프롬프트가 비면 생성할 수 없다.
		expect(screen.getByRole('button', { name: '이미지 생성' })).toBeDisabled()
		await user.type(promptField, '파스텔 그라디언트')
		expect(screen.getByText('캔버스 비율 4:3로 생성')).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 그라디언트',
			count: 1,
			profileId: 3, // 디자인에 선택 컨트롤이 없다 — 목록 첫 항목
			aspectRatio: '4:3',
		})
		await waitFor(() =>
			expect(onChange).toHaveBeenLastCalledWith({
				image: { url: '/api/generated-images/file/canvas.png', generatedImageId: 9 },
			}),
		)
	})

	it('생성 실패는 오류로 알린다', async () => {
		const user = userEvent.setup()
		vi.spyOn(console, 'error').mockImplementation(() => {})
		mocks.requestImageGeneration.mockRejectedValue(new Error('down'))
		render(<Harness allowedTypes={['image']} />)

		await user.type(await openGenerateTab(user), '파스텔 그라디언트')
		await user.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(
			await screen.findByText('이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'),
		).toBeInTheDocument()
	})

	it('프로파일을 못 불러오면 생성이 막히고 이유를 알린다', async () => {
		const user = userEvent.setup()
		render(<Harness allowedTypes={['image']} profiles={[]} profilesFailed />)

		await user.type(await openGenerateTab(user), '파스텔 그라디언트')
		expect(screen.getByRole('button', { name: '이미지 생성' })).toBeDisabled()
		expect(screen.getByText('이미지 프로파일을 불러오지 못했습니다.')).toBeInTheDocument()
		expect(mocks.requestImageGeneration).not.toHaveBeenCalled()
	})

	// compose에 경로가 없는 갈래는 조작 가능해 보이는 컨트롤을 두지 않는다(docs/10 §3.6).
	it('배선되지 않은 배경 컨트롤은 잠긴 채 그려진다', async () => {
		const user = userEvent.setup()
		render(<Harness allowedTypes={['color', 'image', 'graphic']} />)

		await selectBackgroundType(user, 'Image')
		// Preset(브랜드 이미지 목록)과 배경 transform은 계속 잠긴다.
		const browse = screen.getByRole('button', { name: '브랜드 이미지 선택' })
		expect(browse).toHaveTextContent('Browse')
		expect(browse).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Image Transform' })).toBeDisabled()
		expect(screen.queryByRole('slider', { name: '이미지 위치' })).toBeNull()

		// Generate 탭의 두 색 행은 생성 이미지 colorize 파라미터 — 캔버스 경로가 따로 필요하다.
		await openGenerateTab(user)
		expect(screen.getByLabelText('Line Color')).toBeDisabled()
		expect(screen.getByLabelText('Background Color')).toBeDisabled()

		await selectBackgroundType(user, 'Graphic')
		expect(screen.getByLabelText('Graphic Type')).toBeDisabled()
		expect(screen.getByLabelText('Line Color')).toBeDisabled()
		expect(screen.getByLabelText('Background Color')).toBeDisabled()
		// Graphic Transform은 섹션째 잠겨 닫힌다 — 안의 컨트롤은 그려지지 않는다.
		expect(screen.getByRole('button', { name: 'Graphic Transform' })).toBeDisabled()
		expect(screen.queryByRole('slider', { name: '그래픽 위치' })).toBeNull()
	})
})
