import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

		fireEvent.click(screen.getByRole('button', { name: 'PNG로 내보내기' }))

		expect(mocks.exportTemplate).toHaveBeenCalledWith('png')
	})

	it('드롭다운에서 선택한 템플릿 작업대로 이동한다', () => {
		render(<TemplateGenerator navigation={navigation} template={template} />)

		expect(screen.getByLabelText('템플릿')).toHaveValue('/studio/template/cards/1')
		fireEvent.change(screen.getByLabelText('템플릿'), {
			target: { value: '/studio/template/cards/2' },
		})

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
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경"></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('배경'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 배경',
			count: 1,
			profileId: 7,
		})
		await waitFor(() =>
			expect(container.innerHTML).toContain('/api/generated-images/file/bg.png'),
		)
	})
})
