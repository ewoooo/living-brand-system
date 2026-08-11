import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublishedImageProfileDefinition } from '@/features/generate-image/repositories/image-profile.payload.repository'
import {
	deriveImageStudioConfig,
	type ImageStudioConfig,
} from '@/features/image-studio/image-studio-config'
import { ImageGenerator } from './image-generator'

const RESULT = {
	aspectRatio: '2:3' as const,
	generatedImages: [
		{
			collection: 'generated-images' as const,
			createdAt: '2026-08-10T03:00:00.000Z',
			id: 8,
			url: '/api/generated-images/file/generated.png',
		},
	],
	images: ['/api/generated-images/file/generated.png'],
	imageSize: '1K' as const,
	model: 'gpt-image-2',
	profileId: 5,
	prompt: '{"subject":"드론"}',
}

const mocks = vi.hoisted(() => ({
	adjustCamera: vi.fn(),
	generate: vi.fn(),
	// 결과·선택은 테스트마다 갈아끼운다 — 카메라 잠금이 선택에서 파생되기 때문이다.
	session: { result: null as unknown, selected: null as number | null },
}))

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
		adjustCamera: mocks.adjustCamera,
		error: null,
		generate: mocks.generate,
		loading: false,
		requested: 0,
		result: mocks.session.result,
		selected: mocks.session.selected,
		setSelected: vi.fn(),
	}),
}))
vi.mock('@/components/studio/image/image-generation-results', () => ({
	ImageGenerationResults: () => null,
}))

function config(
	id: number,
	name: string,
	overrides: Partial<PublishedImageProfileDefinition> = {},
) {
	return deriveImageStudioConfig({
		id,
		name,
		slug: null,
		imageModelPreset: 'openai-gpt-image-2',
		aspectRatio: '2:3',
		imageSize: '1K',
		...overrides,
	})
}

describe('ImageGenerator', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.session = { result: null, selected: null }
	})
	afterEach(cleanup)

	it('첫 계약의 프로파일로 생성하고 장수·비율·해상도는 계약 시작값을 따른다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '에센허브 브랜드 제품컷')],
			}),
		)

		fireEvent.change(screen.getByRole('textbox', { name: 'Prompt' }), {
			target: { value: '파란 세럼병' },
		})
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.generate).toHaveBeenCalledWith({
			aspectRatio: '2:3',
			count: 4,
			imageSize: '1K',
			profileId: 5,
			prompt: '파란 세럼병',
		})
	})

	it('라우트가 지정한 프로파일을 처음 선택한다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '일러스트레이션'), config(7, '그라디언트')],
				initialProfileId: 7,
			}),
		)

		expect(screen.getByText('그라디언트')).toBeInTheDocument()
	})

	it('빈 캔버스의 예시를 프롬프트에 반영한다', () => {
		render(createElement(ImageGenerator, { configs: [config(5, '제품컷')] }))

		fireEvent.click(
			screen.getByRole('button', {
				name: '신제품을 위한 깨끗한 스튜디오 제품 이미지',
			}),
		)

		expect(screen.getByRole('textbox', { name: 'Prompt' })).toHaveValue(
			'신제품을 위한 깨끗한 스튜디오 제품 이미지',
		)
	})

	it('색을 개방하지 않은 프로파일에는 Profile Settings 섹션이 없다', () => {
		render(createElement(ImageGenerator, { configs: [config(5, '제품컷')] }))

		expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument()
	})

	it('색을 개방한 프로파일은 계약의 색을 조작 가능한 행으로 보여준다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [
					config(5, '라인 일러스트', {
						colorAdjustment: { line: '#000dff', background: '#00ffd4' },
					}),
				],
			}),
		)

		expect(screen.getByText('Profile Settings')).toBeInTheDocument()
		expect(screen.getByLabelText('Line Color 색상 선택')).toHaveValue('#000dff')
		expect(screen.getByLabelText('Background Color 색상 선택')).toBeEnabled()
	})

	// 배경 색 행은 계약에 배경이 실려 있을 때만 그린다.
	it('라인 색만 개방한 프로파일은 배경 색 행을 그리지 않는다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '라인 일러스트', { colorAdjustment: { line: '#000dff' } })],
			}),
		)

		expect(screen.getByLabelText('Line Color 색상 선택')).toBeInTheDocument()
		expect(screen.queryByLabelText('Background Color 색상 선택')).not.toBeInTheDocument()
	})

	it('해상도 선택지가 하나뿐이면 읽기 전용으로 그린다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [
					config(5, '라이트 모델', { imageModelPreset: 'google-nano-banana-2-lite' }),
				],
			}),
		)

		expect(screen.queryByRole('combobox', { name: '해상도' })).not.toBeInTheDocument()
		// 비율은 선택지가 여럿이라 그대로 조작할 수 있다.
		expect(screen.getByRole('combobox', { name: '비율' })).toBeInTheDocument()
	})

	it('결과를 고르기 전에는 Camera Controls가 잠기고 고른 뒤에 열린다', () => {
		const view = render(createElement(ImageGenerator, { configs: [config(5, '제품컷')] }))

		expect(screen.getByRole('button', { name: 'Camera Controls' })).toBeDisabled()
		expect(screen.queryByRole('combobox', { name: 'X' })).not.toBeInTheDocument()

		mocks.session = { result: RESULT, selected: 0 }
		view.rerender(createElement(ImageGenerator, { configs: [config(5, '제품컷')] }))

		expect(screen.getByRole('button', { name: 'Camera Controls' })).toBeEnabled()
		expect(screen.getByRole('combobox', { name: 'X' })).toBeInTheDocument()
	})

	it('시점 조정을 지원하지 않는 프로파일은 Camera Controls를 그리지 않는다', () => {
		mocks.session = { result: RESULT, selected: 0 }
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '평면 그래픽', { cameraControl: false })],
			}),
		)

		expect(screen.queryByText('Camera Controls')).not.toBeInTheDocument()
	})

	it('발행된 프로파일이 없으면 컨트롤러 없이 안내만 그린다', () => {
		render(createElement(ImageGenerator, { configs: [] }))

		expect(screen.getByText('발행된 이미지 프로파일이 없습니다')).toBeInTheDocument()
		expect(screen.queryByRole('textbox', { name: 'Prompt' })).not.toBeInTheDocument()
	})
})

describe('ImageProfilePicker', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.session = { result: null, selected: null }
	})
	afterEach(cleanup)

	function openBrowser(configs: ImageStudioConfig[], initialProfileId?: number) {
		render(createElement(ImageGenerator, { configs, initialProfileId }))
		const trigger = screen.getByRole('button', { name: '프로파일 변경' })
		fireEvent.click(trigger)
		return { panel: screen.getByRole('dialog', { name: 'Image Profiles' }), trigger }
	}

	it('Change로 자산 브라우저가 열리고 프로파일마다 카드가 있다', () => {
		const { panel } = openBrowser([config(5, '제품컷'), config(7, '그라디언트')])

		expect(within(panel).getByRole('button', { name: /제품컷/ })).toBeInTheDocument()
		expect(within(panel).getByRole('button', { name: /그라디언트/ })).toBeInTheDocument()
	})

	// 배지는 그 프로파일이 무엇을 열어주는지의 표시라 계약의 개방 필드에서만 파생한다.
	it('배지를 계약의 개방 필드에서 파생한다', () => {
		const { panel } = openBrowser([
			config(1, '카메라만'),
			config(2, '색만', {
				cameraControl: false,
				colorAdjustment: { line: '#000dff' },
			}),
			config(3, '둘 다', { colorAdjustment: { line: '#000dff' } }),
			config(4, '없음', { cameraControl: false }),
		])

		const cards = {
			camera: within(panel).getByRole('button', { name: /카메라만/ }),
			color: within(panel).getByRole('button', { name: /색만/ }),
			both: within(panel).getByRole('button', { name: /둘 다/ }),
			none: within(panel).getByRole('button', { name: /없음/ }),
		}

		expect(within(cards.camera).getByText('Camera')).toBeInTheDocument()
		expect(within(cards.camera).queryByText('Line Control')).not.toBeInTheDocument()
		expect(within(cards.color).getByText('Line Control')).toBeInTheDocument()
		expect(within(cards.color).queryByText('Camera')).not.toBeInTheDocument()
		expect(within(cards.both).getByText('Camera')).toBeInTheDocument()
		expect(within(cards.both).getByText('Line Control')).toBeInTheDocument()
		expect(within(cards.none).queryByText('Camera')).not.toBeInTheDocument()
		expect(within(cards.none).queryByText('Line Control')).not.toBeInTheDocument()
	})

	it('현재 프로파일 카드를 aria-current로 알린다', () => {
		const { panel } = openBrowser([config(5, '제품컷'), config(7, '그라디언트')], 7)

		expect(within(panel).getByRole('button', { name: /그라디언트/ })).toHaveAttribute(
			'aria-current',
			'true',
		)
		expect(within(panel).getByRole('button', { name: /제품컷/ })).not.toHaveAttribute(
			'aria-current',
		)
	})

	it('카드를 고르면 프로파일이 바뀌고 패널이 닫힌다', () => {
		const { panel } = openBrowser([
			config(5, '제품컷'),
			config(7, '그라디언트', { maxPromptLength: 42 }),
		])

		fireEvent.click(within(panel).getByRole('button', { name: /그라디언트/ }))

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		// 사이드바 헤더가 새 계약을 그린다 — 카운터 상한도 새 프로파일의 것이다.
		expect(screen.getByText('0/42')).toBeInTheDocument()
		fireEvent.change(screen.getByRole('textbox', { name: 'Prompt' }), {
			target: { value: '노란 배경' },
		})
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))
		expect(mocks.generate).toHaveBeenCalledWith(
			expect.objectContaining({ profileId: 7, prompt: '노란 배경' }),
		)
	})

	it('Esc로 닫히고 포커스가 트리거로 돌아온다', async () => {
		const { trigger } = openBrowser([config(5, '제품컷'), config(7, '그라디언트')])

		fireEvent.keyDown(document, { key: 'Escape' })

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		// 포커스 복귀는 언마운트 직후 매크로태스크에서 일어난다.
		await waitFor(() => expect(document.activeElement).toBe(trigger))
	})

	// 후보가 자기 자신뿐이면 고를 것이 없다 — 카드는 남기고 그 사실을 적는다.
	it('프로파일이 하나뿐이면 카드와 함께 교체 대상이 없다고 알린다', () => {
		const { panel } = openBrowser([config(5, '제품컷')])

		expect(within(panel).getByRole('button', { name: /제품컷/ })).toHaveAttribute(
			'aria-current',
			'true',
		)
		expect(
			within(panel).getByText('교체할 다른 이미지 프로파일이 없습니다.'),
		).toBeInTheDocument()
	})
})
