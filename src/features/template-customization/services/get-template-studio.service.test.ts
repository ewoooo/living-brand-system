import { describe, expect, it, vi } from 'vitest'
import type { PublishedHtmlTemplate } from '@/features/template-customization/domain/template-studio-config'
import { getTemplateStudio } from './get-template-studio.service'

const published: PublishedHtmlTemplate = {
	kind: 'html',
	id: 7,
	name: '포스터',
	html: '<div><p data-node-id="1:1" data-figma-type="TEXT" data-name="Title">기본 제목</p></div>',
	nodeConfigs: {
		'1:1': { input: { label: '제목', maxLength: 20, maxLines: 1 } },
	},
	width: 800,
	height: 600,
	templateVersion: '2026-08-01T00:00:00.000Z',
	controllerRestrictions: {
		controls: [{ controlId: 'background.type', availability: 'readonly' }],
	},
	exportPolicy: { allowedFormats: ['png'] },
}

vi.mock('@/features/template-customization/services/get-published-template.service', () => ({
	getPublishedTemplate: vi.fn(async (slug: string) => (slug === 'poster' ? published : null)),
}))
vi.mock('@/features/image-generation/services/list-image-studio-configs.service', () => ({
	listImageStudioConfigs: vi.fn(async () => []),
}))
vi.mock('@/features/graphic-generation/services/list-graphic-studio-configs.service', () => ({
	listGraphicStudioConfigs: vi.fn(async () => []),
}))

describe('getTemplateStudio', () => {
	it('published 템플릿이 없으면 null을 반환한다', async () => {
		expect(await getTemplateStudio('missing', { id: 1 })).toBeNull()
	})

	it('Effective Config를 파생하고 클라이언트 뷰에는 Admin 정책을 싣지 않는다', async () => {
		const studio = await getTemplateStudio('poster', { id: 1 })

		expect(studio?.config).toMatchObject({ studio: 'template', id: 7, name: '포스터' })
		expect(studio?.template).toEqual({
			id: 7,
			name: '포스터',
			html: published.html,
			width: 800,
			height: 600,
		})
		expect(JSON.stringify(studio?.template)).not.toContain('controllerRestrictions')
		expect(JSON.stringify(studio?.template)).not.toContain('exportPolicy')
	})
})
