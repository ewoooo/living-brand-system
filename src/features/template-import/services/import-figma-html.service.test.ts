import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	downloadFigmaImage,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '@/features/template-import/repositories/figma.rest.repository'
import {
	deleteTemplateAsset,
	storeTemplateAsset,
} from '@/features/template-import/repositories/template-asset.payload.repository'
import type { User } from '@/payload-types'
import { importFigmaHtml } from './import-figma-html.service'

vi.mock('@/features/template-import/repositories/figma.rest.repository', () => ({
	downloadFigmaImage: vi.fn(),
	findFigmaImageUrls: vi.fn(),
	findFigmaNodeTree: vi.fn(),
}))

vi.mock('@/features/template-import/repositories/template-asset.payload.repository', () => ({
	deleteTemplateAsset: vi.fn(),
	storeTemplateAsset: vi.fn(),
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

	it('VECTOR를 SVG로 받아 Template Assets URL을 HTML에 저장한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue(node)
		vi.mocked(findFigmaImageUrls).mockResolvedValue({
			'1:2': 'https://figma.example/logo.svg',
		})
		vi.mocked(downloadFigmaImage).mockResolvedValue({
			data: Buffer.from('<svg viewBox="0 0 80 40"/>'),
			mimeType: 'image/svg+xml',
		})
		vi.mocked(storeTemplateAsset).mockResolvedValue({
			id: 10,
			url: '/api/template-assets/file/figma-1-2.svg',
			created: true,
		})

		const result = await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).toHaveBeenCalledWith('file', ['1:2'], 'svg')
		expect(storeTemplateAsset).toHaveBeenCalledWith(
			payload,
			user,
			expect.objectContaining({
				data: expect.any(Buffer),
				filename: expect.stringMatching(/^figma-1-2-[a-f0-9]{12}\.svg$/),
				mimeType: 'image/svg+xml',
			}),
		)
		expect(result.html).toContain('src="/api/template-assets/file/figma-1-2.svg"')
		expect(result.html).not.toContain('data:image/svg+xml')
		expect(result.html).not.toContain('https://figma.example')
	})

	it('VECTOR SVG 렌더가 누락되면 빈 div를 저장하지 않고 실패한다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue(node)
		vi.mocked(findFigmaImageUrls).mockResolvedValue({})

		await expect(
			importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user),
		).rejects.toThrow('Figma SVG render failed for node "1:2".')
		expect(storeTemplateAsset).not.toHaveBeenCalled()
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
		vi.mocked(storeTemplateAsset).mockResolvedValue({
			id: 10,
			url: '/api/template-assets/file/logo.svg',
			created: true,
		})

		await expect(
			importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user),
		).rejects.toThrow('Figma SVG render failed for node "1:3".')
		expect(deleteTemplateAsset).toHaveBeenCalledWith(payload, user, 10)
	})

	it('보이지 않는 VECTOR는 Figma 렌더와 저장을 요청하지 않는다', async () => {
		vi.mocked(findFigmaNodeTree).mockResolvedValue({
			...node,
			children: [{ ...node.children[0], visible: false }],
		})

		await importFigmaHtml({ fileKey: 'file', nodeId: '1:1' }, payload, user)

		expect(findFigmaImageUrls).not.toHaveBeenCalled()
		expect(storeTemplateAsset).not.toHaveBeenCalled()
	})
})
