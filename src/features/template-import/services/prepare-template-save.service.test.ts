import { describe, expect, it, vi } from 'vitest'
import { prepareTemplateSave } from './prepare-template-save.service'

function buildRequest(docs: { id: number; url?: string; _status?: string }[] = []) {
	return {
		payload: {
			find: vi.fn().mockResolvedValue({ docs }),
			update: vi.fn().mockResolvedValue({}),
		},
	}
}

function importedAssetHtml(id = 7) {
	return [
		'<img data-node-id="photo" data-figma-type="RECTANGLE" data-name="Photo"',
		`data-asset-collection="application-images" data-asset-id="${id}"`,
		`src="/api/application-images/file/figma-photo.png" alt="">`,
	].join(' ')
}

describe('prepareTemplateSave', () => {
	it('최종 HTML에서 사용하는 Figma draft만 같은 요청으로 발행한다', async () => {
		const html = importedAssetHtml()
		const req = buildRequest([
			{
				id: 7,
				url: '/api/application-images/file/figma-photo.png',
				_status: 'draft',
			},
		])

		await expect(
			prepareTemplateSave({
				data: {
					_status: 'published',
					baseHtml: html,
					html,
					overrides: {},
					width: 1200,
					height: 800,
				},
				req: req as never,
			}),
		).resolves.toBeNull()
		expect(req.payload.update).toHaveBeenCalledWith({
			collection: 'application-images',
			id: 7,
			data: { _status: 'published' },
			overrideAccess: true,
			req,
		})
	})

	it('최종 HTML에서 교체된 Figma draft는 발행하지 않는다', async () => {
		const officialUrl = '/api/brand-logos/file/official.svg'
		const req = buildRequest([{ id: 8, url: officialUrl }])

		await expect(
			prepareTemplateSave({
				data: {
					_status: 'published',
					baseHtml: importedAssetHtml(),
					html: `<img data-node-id="photo" data-asset-collection="brand-logos" data-asset-id="8" src="${officialUrl}" alt="">`,
					overrides: {
						photo: {
							vectorAsset: { collection: 'brand-logos', id: 8, src: officialUrl },
						},
					},
					width: 1200,
					height: 800,
				},
				req: req as never,
			}),
		).resolves.toBeNull()
		expect(req.payload.update).not.toHaveBeenCalled()
	})

	it('부분 publish 요청은 기존 draft 모델과 합쳐 검사한다', async () => {
		const req = buildRequest()

		await expect(
			prepareTemplateSave({
				data: { _status: 'published' },
				originalDoc: {
					baseHtml:
						'<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
					html: '<img data-node-id="logo" src="/api/template-assets/file/imported.svg">',
					overrides: {},
					width: 1200,
					height: 800,
				},
				req: req as never,
			}),
		).resolves.toContain('모든 URL은 인가 에셋')
	})

	it('published 문서의 상태 없는 부분 update도 다시 검사한다', async () => {
		const req = buildRequest()

		await expect(
			prepareTemplateSave({
				data: { html: '<img data-node-id="logo" src="https://attacker.example/x">' },
				originalDoc: {
					_status: 'published',
					baseHtml: '<p data-node-id="name">기존</p>',
					html: '<p data-node-id="name">기존</p>',
					overrides: {},
					width: 1200,
					height: 800,
				},
				req: req as never,
			}),
		).resolves.toContain('Draft HTML에는 내부 에셋')
	})

	it('draft 저장에서는 에셋을 발행하지 않는다', async () => {
		const req = buildRequest()

		await expect(
			prepareTemplateSave({
				data: {
					_status: 'draft',
					html: '<p data-node-id="name">이름</p>',
					overrides: {},
				},
				req: req as never,
			}),
		).resolves.toBeNull()
		expect(req.payload.find).not.toHaveBeenCalled()
		expect(req.payload.update).not.toHaveBeenCalled()
	})

	it('published Template의 Controller override가 기본 슬롯 계약을 확장하면 거부한다', async () => {
		const req = buildRequest()

		await expect(
			prepareTemplateSave({
				data: {
					_status: 'published',
					html: '<p data-node-id="name" data-figma-type="TEXT">이름</p>',
					overrides: { name: { input: { label: '이름', maxLength: 20 } } },
					width: 1200,
					height: 800,
					controller: {
						groups: [
							{
								key: 'unknown',
								title: 'Unknown',
								controls: [],
							},
						],
					},
				},
				req: req as never,
			}),
		).resolves.toContain('override group')
	})
})
