import type { PayloadRequest } from 'payload'
import sharp from 'sharp'
import { z } from 'zod/v3'
import { findTemplatesForRequest } from '@/features/agent-chat/services/agent-template-request.service'
import { searchAgentGuidelines } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { decodeImageDataUri } from '@/features/generate-image/image-data-uri'
import { loadGeneratedImage } from '@/features/generate-image/repositories/generated-image.payload.repository'
import { generateImages } from '@/features/generate-image/services/generate-image.service'
import { listAvailableImageProfiles } from '@/features/generate-image/services/list-image-profiles.service'
import { isPayloadUser } from '@/lib/auth'
import { startCheckSession } from '@/services/start-check-session.service'

type McpToolArgs = Record<string, unknown>

/** MCP 조회 도구가 기능 서비스 결과를 공통 text 콘텐츠로 반환하게 한다. */
export const mcpTextTool = (
	name: string,
	description: string,
	parameters: Record<string, z.ZodTypeAny>,
	run: (args: McpToolArgs, req: PayloadRequest) => Promise<unknown>,
) => ({
	name,
	description,
	parameters,
	handler: async (args: McpToolArgs, req: PayloadRequest) => ({
		content: [{ type: 'text' as const, text: JSON.stringify(await run(args, req)) }],
	}),
})

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)
const number = (value: unknown) => (typeof value === 'number' ? value : undefined)
const user = (req: PayloadRequest) => {
	if (!isPayloadUser(req.user)) throw new Error('Authentication required.')
	return req.user
}

// ponytail: MCP tools only validate transport input and reuse the existing feature services.
export const customMcpTools = [
	mcpTextTool(
		'searchGuidelines',
		'Search published brand guideline titles, paths, descriptions, body content, and checks.',
		{ query: z.string().trim().min(1).max(120) },
		(args, req) => searchAgentGuidelines(user(req), { query: text(args.query) ?? '' }),
	),
	mcpTextTool(
		'findTemplates',
		'Find or list published production templates and their open text slots.',
		{ query: z.string().trim().min(1).max(120).optional() },
		(args, req) => findTemplatesForRequest(user(req), text(args.query)),
	),
	mcpTextTool(
		'listImageProfiles',
		'List published brand image profiles available to the current user.',
		{},
		(_args, req) => listAvailableImageProfiles(user(req)),
	),
	mcpTextTool(
		'runAssetCheck',
		'Run the selected brand quality check scenario on a PNG, JPEG, or WebP data URI.',
		{
			imageData: z.string().max(4_000_000),
			imageName: z.string().trim().min(1).max(120).optional(),
			scenarioKey: z.string().trim().min(1).max(80).optional(),
		},
		async (args, req) => {
			const image = await decodeImageDataUri(text(args.imageData) ?? '')
			const { checkSessionId, pendingCheckKeys, results } = await startCheckSession({
				buffer: image.data,
				imageName: text(args.imageName) ?? 'mcp-image',
				scenarioKey: text(args.scenarioKey),
				source: 'mcp-call',
				user: user(req),
			})
			return { checkSessionId, pendingCheckKeys, results }
		},
	),
	{
		name: 'generateBrandImage',
		description:
			'Generate and store brand images with a published profile, then return stored original URLs and inline WebP previews.',
		parameters: {
			prompt: z.string().trim().min(1).max(500),
			profileId: z.number().int().positive(),
			count: z.number().int().min(1).max(2).optional(),
		},
		handler: async (args: McpToolArgs, req: PayloadRequest) => {
			const authenticatedUser = user(req)
			const requestUrl = req.url
			if (!requestUrl) throw new Error('Request URL is required.')
			const result = await generateImages({
				count: number(args.count) ?? 1,
				profileId: number(args.profileId) ?? 0,
				user: authenticatedUser,
				userInput: text(args.prompt) ?? '',
			})
			const generatedImages = result.generatedImages ?? []
			const previews = await Promise.all(
				generatedImages.map(async ({ id }) => {
					const image = await loadGeneratedImage({
						generatedImageId: id,
						profileId: result.profileId ?? 0,
						requestUrl,
						user: authenticatedUser,
					})
					if (!image) throw new Error('Generated image is unavailable.')
					const preview = await sharp(image)
						.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
						.webp({ quality: 82 })
						.toBuffer()
					return {
						type: 'image' as const,
						data: preview.toString('base64'),
						mimeType: 'image/webp',
					}
				}),
			)

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify({
							aspectRatio: result.aspectRatio,
							generatedImages: generatedImages.map((image) => ({
								...image,
								url: new URL(image.url, requestUrl).toString(),
							})),
							imageSize: result.imageSize,
							model: result.model,
							profileId: result.profileId,
							profileName: result.profileName,
							prompt: result.prompt,
						}),
					},
					...previews,
				],
			}
		},
	},
]
