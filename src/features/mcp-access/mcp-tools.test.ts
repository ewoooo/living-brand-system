import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v3'

const mocks = vi.hoisted(() => ({
	findTemplatesForRequest: vi.fn(),
	generateImages: vi.fn(),
	listAvailableImageProfiles: vi.fn(),
	loadGeneratedImage: vi.fn(),
	searchAgentGuidelines: vi.fn(),
	startCheckSession: vi.fn(),
}))

vi.mock('@/features/agent-chat/services/agent-template-request.service', () => ({
	findTemplatesForRequest: mocks.findTemplatesForRequest,
}))
vi.mock('@/features/agent-chat/services/get-agent-guideline-context.service', () => ({
	searchAgentGuidelines: mocks.searchAgentGuidelines,
}))
vi.mock('@/features/generate-image/repositories/generated-image.payload.repository', () => ({
	loadGeneratedImage: mocks.loadGeneratedImage,
}))
vi.mock('@/features/generate-image/services/generate-image.service', () => ({
	generateImages: mocks.generateImages,
}))
vi.mock('@/features/generate-image/services/list-image-profiles.service', () => ({
	listAvailableImageProfiles: mocks.listAvailableImageProfiles,
}))
vi.mock('@/services/start-check-session.service', () => ({
	startCheckSession: mocks.startCheckSession,
}))

import { customMcpTools } from './mcp-tools'

const ONE_PIXEL_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const requestUser = { email: 'worker@example.com', id: 1, role: 'worker' } as const
const request = {
	url: 'https://lbs.example/api/mcp',
	user: requestUser,
} as unknown as PayloadRequest

function getTool(name: string) {
	const tool = customMcpTools.find((candidate) => candidate.name === name)
	if (!tool) throw new Error(`Missing MCP tool: ${name}`)
	return tool
}

describe('custom MCP tools', () => {
	beforeEach(() => vi.clearAllMocks())

	it('요청한 다섯 도구를 노출한다', () => {
		expect(customMcpTools.map(({ name }) => name)).toEqual([
			'searchGuidelines',
			'findTemplates',
			'listImageProfiles',
			'runAssetCheck',
			'generateBrandImage',
		])
	})

	it('검증된 data URI를 공통 검수 세션에 전달한다', async () => {
		mocks.startCheckSession.mockResolvedValue({
			checkSessionId: 9,
			pendingCheckKeys: [],
			results: { 'logo.clear-space': { rawResult: { status: 'pass' } } },
			rulesetSnapshot: [],
		})
		const tool = getTool('runAssetCheck')

		await expect(
			tool.handler(
				{ imageData: ONE_PIXEL_PNG, imageName: 'logo.png', scenarioKey: 'logo' },
				request,
			),
		).resolves.toEqual({
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						checkSessionId: 9,
						pendingCheckKeys: [],
						results: { 'logo.clear-space': { rawResult: { status: 'pass' } } },
					}),
				},
			],
		})
		expect(mocks.startCheckSession).toHaveBeenCalledWith({
			buffer: expect.any(Buffer),
			imageName: 'logo.png',
			scenarioKey: 'logo',
			source: 'mcp-call',
			user: requestUser,
		})
	})

	it('검수 입력으로 외부 URL을 받지 않는다', async () => {
		const tool = getTool('runAssetCheck')

		await expect(
			tool.handler({ imageData: 'https://example.com/logo.png' }, request),
		).rejects.toThrow('Invalid image data URI.')
		expect(mocks.startCheckSession).not.toHaveBeenCalled()
	})

	it('생성 원본 메타데이터와 실제 이미지 미리보기를 함께 반환한다', async () => {
		const image = Buffer.from(ONE_PIXEL_PNG.split(',')[1] ?? '', 'base64')
		mocks.generateImages.mockResolvedValue({
			aspectRatio: '1:1',
			generatedImages: [
				{
					collection: 'generated-images',
					createdAt: '2026-07-31T03:00:00.000Z',
					id: 8,
					url: '/api/generated-images/file/generated.png',
				},
			],
			imageSize: '1K',
			images: ['/api/generated-images/file/generated.png'],
			model: 'gpt-image-2',
			profileId: 5,
			profileName: '제품 이미지',
			prompt: '{"subject":"파란 세럼병"}',
			provider: 'openai',
		})
		mocks.loadGeneratedImage.mockResolvedValue(image)
		const result = await getTool('generateBrandImage').handler(
			{ prompt: '파란 세럼병', profileId: 5 },
			request,
		)

		expect(mocks.generateImages).toHaveBeenCalledWith({
			count: 1,
			profileId: 5,
			user: requestUser,
			userInput: '파란 세럼병',
		})
		expect(mocks.loadGeneratedImage).toHaveBeenCalledWith({
			generatedImageId: 8,
			profileId: 5,
			requestUrl: 'https://lbs.example/api/mcp',
			user: requestUser,
		})
		expect(result.content).toHaveLength(2)
		expect(result.content[0]).toMatchObject({
			type: 'text',
			text: expect.stringContaining(
				'https://lbs.example/api/generated-images/file/generated.png',
			),
		})
		expect(result.content[1]).toMatchObject({
			type: 'image',
			data: expect.any(String),
			mimeType: 'image/webp',
		})
	})

	it('이미지 생성 수를 두 장 이하로 제한한다', () => {
		const tool = getTool('generateBrandImage')
		const schema = z.object(tool.parameters)

		expect(schema.safeParse({ count: 2, profileId: 5, prompt: '제품 사진' }).success).toBe(true)
		expect(schema.safeParse({ count: 3, profileId: 5, prompt: '제품 사진' }).success).toBe(
			false,
		)
	})
})
