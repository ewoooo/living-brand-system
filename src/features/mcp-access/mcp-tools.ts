import type { PayloadRequest } from 'payload'
import sharp from 'sharp'
import { z } from 'zod/v3'
import { findTemplatesForRequest } from '@/features/agent-chat/services/agent-template-request.service'
import { searchAgentGuidelines } from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { buildAiObservationTask } from '@/features/asset-check/domain/ai-observation-task'
import {
	aiReferenceAssetKey,
	findUnavailableAiReferenceCheckKeys,
	loadAiReferenceFiles,
} from '@/features/asset-check/repositories/ai-check.ai.repository'
import { resizeForAiVision } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { decodeImageDataUri } from '@/features/generate-image/image-data-uri'
import { loadGeneratedImage } from '@/features/generate-image/repositories/generated-image.payload.repository'
import { generateImages } from '@/features/generate-image/services/generate-image.service'
import { listAvailableImageProfiles } from '@/features/generate-image/services/list-image-profiles.service'
import { isPayloadUser } from '@/lib/auth'
import {
	type ClientCheckObservations,
	completeCheckSessionObservations,
	startCheckSession,
} from '@/services/start-check-session.service'

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
const clientObservationSchema = z.strictObject({
	value: z.union([z.number(), z.enum(['present', 'absent', 'uncertain', 'not_applicable'])]),
	confidence: z.number().min(0).max(100),
	reason: z.string().trim().min(1).max(300),
})
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
	{
		name: 'runAssetCheck',
		description:
			'Run deterministic checks and return the image plus observation questions for the connected AI. Follow with submitAssetCheckObservations.',
		parameters: {
			imageData: z.string().max(4_000_000),
			imageName: z.string().trim().min(1).max(120).optional(),
			scenarioKey: z.string().trim().min(1).max(80).optional(),
		},
		handler: async (args: McpToolArgs, req: PayloadRequest) => {
			const image = await decodeImageDataUri(text(args.imageData) ?? '')
			const { checkSessionId, pendingCheckKeys, results, rulesetSnapshot } =
				await startCheckSession({
					buffer: image.data,
					deferHeuristic: true,
					imageName: text(args.imageName) ?? 'mcp-image',
					scenarioKey: text(args.scenarioKey),
					source: 'mcp-call',
					user: user(req),
				})
			const pending = rulesetSnapshot.filter((check) => pendingCheckKeys.includes(check.key))
			const referenceFilesByKey = await loadAiReferenceFiles(pending)
			const referenceKeys = new Set(
				pending.flatMap((check) => check.referenceAssets.map(aiReferenceAssetKey)),
			)
			const referenceFiles = [...referenceKeys].flatMap((key) => {
				const file = referenceFilesByKey.get(key)
				return file ? [file] : []
			})
			const observationTask = buildAiObservationTask(pending, referenceFiles.length > 0)
			const task = {
				checkSessionId,
				status: pending.length ? 'awaiting_client_observations' : 'completed',
				results,
				pendingCheckKeys,
				unavailableReferenceCheckKeys: findUnavailableAiReferenceCheckKeys(
					pending,
					referenceFilesByKey,
				),
				nextTool: pending.length ? 'submitAssetCheckObservations' : null,
				...observationTask,
			}
			const content: (
				| { type: 'text'; text: string }
				| { type: 'image'; data: string; mimeType: string }
			)[] = [{ type: 'text', text: JSON.stringify(task) }]
			if (pending.length) {
				content.push(
					{ type: 'text' as const, text: 'Target image to check:' },
					{
						type: 'image' as const,
						data: (await resizeForAiVision(image.data)).toString('base64'),
						mimeType: image.mimeType,
					},
					...referenceFiles.flatMap((file) => [
						{
							type: 'text' as const,
							text: `Reference image (${file.role}): ${file.name}`,
						},
						{
							type: 'image' as const,
							data: file.data.toString('base64'),
							mimeType: file.mediaType,
						},
					]),
				)
			}

			return { content, structuredContent: task }
		},
	},
	mcpTextTool(
		'submitAssetCheckObservations',
		'Submit observations from the connected AI after runAssetCheck. The server validates them and decides the final result.',
		{
			checkSessionId: z.number().int().positive(),
			observations: z
				.record(z.string(), z.record(z.string(), clientObservationSchema))
				.optional(),
			advices: z.record(z.string(), z.string().trim().min(1).max(2000)).optional(),
		},
		(args, req) =>
			completeCheckSessionObservations({
				advices: args.advices as Record<string, string> | undefined,
				checkSessionId: number(args.checkSessionId) ?? 0,
				observations: args.observations as ClientCheckObservations | undefined,
				user: user(req),
			}),
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
