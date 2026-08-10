import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetCreateNavigationOutput } from '@/services/get-create-navigation.service'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'
import { TemplateGenerator } from './template-generator'

const mocks = vi.hoisted(() => ({
	exportTemplate: vi.fn(),
	push: vi.fn(),
	requestImageGeneration: vi.fn(),
}))

vi.mock('@/features/template-export/hooks/use-template-export', () => ({
	useTemplateExport: () => ({
		canExport: () => false,
		exporting: null,
		exportError: null,
		exportTemplate: mocks.exportTemplate,
	}),
}))
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/features/generate-image/services/generate-image.client', () => ({
	requestImageGeneration: mocks.requestImageGeneration,
	requestPublishedImageProfiles: vi.fn().mockResolvedValue([]),
}))

const template: PublishedHtmlTemplate = {
	kind: 'html',
	id: 1,
	name: '테스트 템플릿',
	html: '<div>미리보기</div>',
	nodeConfigs: {},
	width: 400,
	height: 300,
	templateVersion: '2026-07-29T00:00:00.000Z',
}

const navigation: GetCreateNavigationOutput = {
	categories: [
		{
			id: 1,
			title: '카드',
			slug: 'cards',
			href: '/studio/template/cards',
			templates: [
				{ id: 1, name: '테스트 템플릿', href: '/studio/template/cards/1' },
				{ id: 2, name: '두 번째 템플릿', href: '/studio/template/cards/2' },
			],
		},
	],
}

describe('TemplateGenerator', () => {
	beforeEach(() => vi.clearAllMocks())
	afterEach(cleanup)

	it('공통 Studio 작업대에서 템플릿을 내보낸다', () => {
		const { container } = render(
			<TemplateGenerator navigation={navigation} template={template} />,
		)

		expect(container.querySelector('[data-slot="studio-workspace"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-controller"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-canvas"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="inspector-panel"]')).not.toBeNull()

		fireEvent.click(screen.getByRole('button', { name: '내보내기' }))

		// 포맷 셀렉트 기본값이 PNG — canExport가 전부 false여도 PNG는 항상 내보낼 수 있다.
		expect(mocks.exportTemplate).toHaveBeenCalledWith('png')
	})

	it('아이덴티티 카드의 Change로 선택한 템플릿 작업대로 이동한다', async () => {
		const user = userEvent.setup()
		render(<TemplateGenerator navigation={navigation} template={template} />)

		// 카드가 현재 템플릿 이름과 카테고리를 보여준다.
		expect(screen.getByText('테스트 템플릿')).toBeInTheDocument()
		expect(screen.getByText('카드')).toBeInTheDocument()

		// jsdom에는 pointer capture가 없어 트리거는 키보드로 연다(radix pointer 경로 회피).
		screen.getByRole('combobox', { name: '템플릿 변경' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: '두 번째 템플릿' }))

		expect(mocks.push).toHaveBeenCalledWith('/studio/template/cards/2')
	})

	it('개방된 이미지 슬롯에서 생성한 이미지를 미리보기에 합성한다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					// 이미지 슬롯 노드는 임포트가 캐리어로 마킹한 표면이다 — compose는 캐리어 전용.
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 배경',
			count: 1,
			profileId: 7,
			aspectRatio: undefined, // 박스 없는 슬롯은 프로파일 비율 그대로
		})
		await waitFor(() =>
			expect(container.innerHTML).toContain('/api/generated-images/file/bg.png'),
		)
	})

	it('저작 config의 imageColorize를 이미지 교체 시 재적용한다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: {
						'1:1': { imageInput: { profileId: 7 }, imageColorize: { line: '#ff0000' } },
					},
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		// 호출부가 imageColorize를 깔지 않으면 컬러 치환(마스크 오버레이)이 사라진다 — 그 스프레드를 잡는다.
		await waitFor(() => {
			expect(container.innerHTML).toContain('mask-image')
			expect(container.innerHTML).toContain('rgb(255, 0, 0)')
		})
	})

	it('슬롯 박스가 있으면 가장 가까운 지원 비율을 생성 요청에 싣는다', () => {
		mocks.requestImageGeneration.mockResolvedValue({ generatedImages: [] })
		render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" style="width:911px;height:492px;"></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		expect(screen.getByText('슬롯 비율 16:9로 생성')).toBeInTheDocument()
		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 배경',
			count: 1,
			profileId: 7,
			aspectRatio: '16:9',
		})
	})
})
