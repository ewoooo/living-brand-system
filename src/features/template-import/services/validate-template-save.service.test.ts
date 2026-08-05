import { describe, expect, it, vi } from 'vitest'
import {
	findTemplateDraftBlocker,
	findTemplatePublishBlocker,
} from './validate-template-save.service'

function repositoryContext(docs: { id: number; url?: string }[] = []) {
	return {
		payload: {
			find: vi.fn().mockResolvedValue({ docs }),
		},
	} as never
}

describe('template save validation', () => {
	it('발행 가능한 HTML 모델과 크기를 요구한다', async () => {
		await expect(findTemplatePublishBlocker({}, repositoryContext())).resolves.toBe(
			'발행할 HTML 템플릿이 필요합니다.',
		)

		await expect(
			findTemplatePublishBlocker(
				{
					baseHtml: '<p data-node-id="name">이름</p>',
					html: '<p data-node-id="name">이름</p>',
					overrides: {},
					width: 0,
					height: 800,
				},
				repositoryContext(),
			),
		).resolves.toContain('width와 height는 0보다 큰 숫자')
	})

	it('안전한 raster data URI는 draft에만 허용한다', async () => {
		const dataUri =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZVQAAAAASUVORK5CYII='
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: `<div data-node-id="frame" style='background-image:url("${dataUri}")'></div>`,
			overrides: { frame: { backgroundImage: dataUri } },
			width: 1200,
			height: 800,
		}

		expect(findTemplateDraftBlocker(candidate)).toBeNull()
		await expect(findTemplatePublishBlocker(candidate, repositoryContext())).resolves.toContain(
			'draft에서만 사용할 수 있습니다',
		)
	})

	it('생성 이미지 ID와 published URL이 일치해야 한다', async () => {
		const url = '/api/generated-images/file/background.png'
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: `<div data-node-id="frame" style='background-image:url("${url}")'></div>`,
			overrides: { frame: { backgroundImage: url, generatedImageId: 42 } },
			width: 1200,
			height: 800,
		}

		await expect(
			findTemplatePublishBlocker(candidate, repositoryContext([{ id: 42, url }])),
		).resolves.toBeNull()
		await expect(
			findTemplatePublishBlocker(
				candidate,
				repositoryContext([{ id: 42, url: '/api/generated-images/file/other.png' }]),
			),
		).resolves.toContain('인가 에셋 참조가 유효하지 않습니다')
	})

	it('구조화 참조 없는 배경 이미지는 발행하지 않는다', async () => {
		const candidate = {
			baseHtml: '<div data-node-id="frame"></div>',
			html: '<div data-node-id="frame"></div>',
			overrides: {
				frame: { backgroundImage: '/api/application-images/file/background.png' },
			},
			width: 1200,
			height: 800,
		}

		await expect(findTemplatePublishBlocker(candidate, repositoryContext())).resolves.toContain(
			'draft에서만 사용할 수 있습니다',
		)
	})

	it('발행 에셋 ID와 URL을 Payload에서 확인한다', async () => {
		const url = '/api/application-images/file/logo.svg'
		const candidate = {
			baseHtml: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
			html: `<img data-node-id="logo" src="${url}">`,
			overrides: {
				logo: {
					vectorAsset: { collection: 'application-images' as const, id: 7, src: url },
				},
			},
			width: 1200,
			height: 800,
		}

		await expect(
			findTemplatePublishBlocker(candidate, repositoryContext([{ id: 7, url }])),
		).resolves.toBeNull()
	})
})
