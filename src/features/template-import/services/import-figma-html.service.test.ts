import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	discardImportedApplicationImage,
	stageImportedApplicationImage,
} from '@/features/application-image/services/manage-imported-application-images.service'
import {
	downloadFigmaImage,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '@/features/template-import/repositories/figma.rest.repository'
import type { User } from '@/payload-types'
import { importFigmaHtml } from './import-figma-html.service'

vi.mock('@/features/template-import/repositories/figma.rest.repository', () => ({
	downloadFigmaImage: vi.fn(),
	findFigmaImageUrls: vi.fn(),
	findFigmaNodeTree: vi.fn(),
}))

vi.mock('@/features/application-image/services/manage-imported-application-images.service', () => ({
	discardImportedApplicationImage: vi.fn(),
	stageImportedApplicationImage: vi.fn(),
}))

const payload = {} as Payload
const user = { id: 1, role: 'manager' } as User

const node = {
	id: '1:1',
	name: 'card',
	type: 'FRAME',
	absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
	children: [
		{
			id: '1:2',
			name: 'logo',
			type: 'VECTOR',
			absoluteBoundingBox: { x: 20, y: 30, width: 80, height: 40 },
		},
	],
}

describe('importFigmaHtml', () => {
	beforeEach(() => vi.resetAllMocks())

	it('VECTOR를 SVG Application Images draft로 받아 구조화 참조를 HTML에 저장한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue(node)
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'1:2': 'https://figma.example/logo.svg',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from('<svg viewBox="0 0 80 40"/>'),
			mimeType: 'image/svg+xml',
		})
		vi.mocked(stageImportedApplicationImage).mockResolvedValue({
			collection: 'application-images',
			id: 10,
			url: '/api/application-images/file/figma-vector.svg',
			created: true,
		})

		const result = await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).toHaveBeenCalledWith('file', ['1:2'], 'svg')
		expect(stageImportedApplicationImage).toHaveBeenCalledWith(
			payload,
			user,
			expect.objectContaining({
				data: expect.any(Buffer),
				filename: expect.stringMatching(/^figma-[a-f0-9]{24}\.svg$/),
				mimeType: 'image/svg+xml',
				name: 'logo',
			}),
		)
		expect(result.html).toContain('src="/api/application-images/file/figma-vector.svg"')
		expect(result.html).toContain('data-asset-collection="application-images"')
		expect(result.html).toContain('data-asset-id="10"')
		expect(result.html).not.toContain('data:image/svg+xml')
		expect(result.html).not.toContain('https://figma.example')
	})

	it('VECTOR SVG 렌더가 누락되면 빈 div를 저장하지 않고 실패한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue(node)
		vi.mocked(findFigmaImageUrls).mockResolvedValue({})

		await expect(
			importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user),
		).rejects.toThrow('Figma SVG render failed for node "1:2".')
		expect(stageImportedApplicationImage).not.toHaveBeenCalled()
	})

	it('뒤 벡터 처리에 실패하면 이번 요청에서 앞서 생성한 에셋을 제거한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [node.children[0], { ...node.children[0], id: '1:3' }],
		})
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'1:2': 'https://figma.example/logo.svg',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from('<svg/>'),
			mimeType: 'image/svg+xml',
		})
		vi.mocked(stageImportedApplicationImage).mockResolvedValue({
			collection: 'application-images',
			id: 10,
			url: '/api/application-images/file/logo.svg',
			created: true,
		})

		await expect(
			importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user),
		).rejects.toThrow('Figma SVG render failed for node "1:3".')
		expect(discardImportedApplicationImage).toHaveBeenCalledWith(payload, user, 10)
	})

	it('보이지 않는 VECTOR는 Figma 렌더와 저장을 요청하지 않는다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [{ ...node.children[0], visible: false }],
		})

		await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).not.toHaveBeenCalled()
		expect(stageImportedApplicationImage).not.toHaveBeenCalled()
	})

	it('IMAGE fill은 PNG로 렌더해 픽셀을 보존한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [
				{
					id: '1:4',
					name: 'photo',
					type: 'RECTANGLE',
					fills: [{ type: 'IMAGE' }],
					absoluteBoundingBox: { x: 10, y: 10, width: 120, height: 80 },
				},
			],
		})
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'1:4': 'https://figma.example/photo.png',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
			mimeType: 'image/png',
		})
		vi.mocked(stageImportedApplicationImage).mockResolvedValue({
			collection: 'application-images',
			id: 11,
			url: '/api/application-images/file/photo.png',
			created: true,
		})

		const result = await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).toHaveBeenCalledWith('file', ['1:4'], 'png')
		expect(result.html).toContain('src="/api/application-images/file/photo.png"')
	})

	it('TEXT_PATH와 알 수 없는 leaf node만 PNG fallback하고 SLICE는 기존 동작을 유지한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [
				{
					id: '5:1',
					name: 'curved title',
					type: 'TEXT_PATH',
					absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
				},
				{
					id: '6:1',
					name: 'future node',
					type: 'FUTURE_NODE',
					absoluteBoundingBox: { x: 0, y: 50, width: 80, height: 80 },
				},
				{
					id: '7:1',
					name: 'export slice',
					type: 'SLICE',
					absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
				},
			],
		})
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'5:1': 'https://figma.example/text-path.png',
			'6:1': 'https://figma.example/future.png',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
			mimeType: 'image/png',
		})
		vi.mocked(stageImportedApplicationImage)
			.mockResolvedValueOnce({
				collection: 'application-images',
				id: 15,
				url: '/api/application-images/file/text-path.png',
				created: true,
			})
			.mockResolvedValueOnce({
				collection: 'application-images',
				id: 16,
				url: '/api/application-images/file/future.png',
				created: true,
			})

		const result = await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).toHaveBeenCalledWith('file', ['5:1', '6:1'], 'png')
		expect(result.html).toContain('src="/api/application-images/file/text-path.png"')
		expect(result.html).toContain('src="/api/application-images/file/future.png"')
		expect(result.html).toContain('data-node-id="7:1"')
	})

	it('mask 합성과 회전·scale 레이어는 가장 가까운 레이어를 PNG fallback으로 고정한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [
				{
					id: '2:1',
					name: 'masked group',
					type: 'GROUP',
					absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
					children: [
						{ id: '2:2', type: 'RECTANGLE', isMask: true },
						{ id: '2:3', type: 'RECTANGLE', fills: [{ type: 'IMAGE' }] },
					],
				},
				{
					id: '3:1',
					name: 'rotated title',
					type: 'TEXT',
					rotation: 12,
					characters: 'Title',
					absoluteBoundingBox: { x: 120, y: 0, width: 80, height: 30 },
				},
				{
					id: '4:1',
					name: 'scaled frame',
					type: 'FRAME',
					relativeTransform: [
						[1.5, 0, 220],
						[0, 1.5, 0],
					],
					absoluteBoundingBox: { x: 220, y: 0, width: 150, height: 150 },
				},
			],
		})
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'2:1': 'https://figma.example/mask.png',
			'3:1': 'https://figma.example/title.png',
			'4:1': 'https://figma.example/scaled.png',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
			mimeType: 'image/png',
		})
		vi.mocked(stageImportedApplicationImage)
			.mockResolvedValueOnce({
				collection: 'application-images',
				id: 12,
				url: '/api/application-images/file/mask.png',
				created: true,
			})
			.mockResolvedValueOnce({
				collection: 'application-images',
				id: 13,
				url: '/api/application-images/file/title.png',
				created: true,
			})
			.mockResolvedValueOnce({
				collection: 'application-images',
				id: 14,
				url: '/api/application-images/file/scaled.png',
				created: true,
			})

		const result = await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).toHaveBeenCalledWith('file', ['2:1', '3:1', '4:1'], 'png')
		expect(result.html).not.toContain('data-node-id="2:2"')
		expect(result.html).toContain('src="/api/application-images/file/mask.png"')
		expect(result.html).toContain('src="/api/application-images/file/title.png"')
		expect(result.html).toContain('src="/api/application-images/file/scaled.png"')
	})
})
