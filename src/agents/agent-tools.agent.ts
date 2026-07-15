import { type ToolSet, tool } from 'ai'
import { z } from 'zod'
import {
	type AgentSkillDetail,
	findEnabledAgentSkillByName,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import {
	findTemplatesForRequest,
	prepareTemplateImage,
	templateSlotValueSchema,
} from '@/features/agent-chat/services/agent-template-request.service'
import {
	listAgentChecks,
	listAgentGuidelineDocuments,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from '@/features/agent-chat/services/get-agent-guideline-context.service'
import { type CheckScenario, getCheckScenario } from '@/features/asset-check/scenarios'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'
import { IMAGE_SCENES } from '@/features/image-generation/presets'
import {
	type AgentGeneratedImagesAttachment,
	generateImageCandidates,
} from '@/features/image-generation/services/generate-image.service'
import { AgentConfigurationError } from '@/lib/errors'
import type { User } from '@/payload-types'
import { startCheckSession } from '@/services/start-check-session.service'

const guidelineToolContextSchema = z.object({
	agentChatSessionId: z.number().int().positive().optional(),
	user: z.unknown(),
})

const imageSceneSummary = IMAGE_SCENES.map((scene) => `${scene.id} (${scene.label})`).join(', ')

/**
 * Agent answer stream에 전달할 AI SDK tool set을 만든다.
 * 실제 skill/guideline I/O는 tool 실행 시 주입되는 user context로 수행한다.
 */
export function getAgentTools() {
	return {
		loadSkill: tool({
			description: 'Load the full instructions for an enabled agent skill by name.',
			inputSchema: z.object({
				name: z.string().min(1).max(80),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: async ({ name }, { context }) => {
				const skill = await findEnabledAgentSkillByName(context.user, name)

				if (!skill) {
					throw new AgentConfigurationError('Agent skill is not configured.')
				}

				return formatLoadedSkill(skill)
			},
		}),
		listGuidelineDocuments: tool({
			description: 'List published brand guideline documents available to read.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => listAgentGuidelineDocuments(context.user),
		}),
		searchGuidelines: tool({
			description: 'Search published brand guideline documents.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ query }, { context }) => searchAgentGuidelines(context.user, { query }),
		}),
		readGuidelineDocument: tool({
			description: 'Read a published guideline document returned by searchGuidelines.',
			inputSchema: z.object({
				collection: z.literal('guideline-documents'),
				id: z.string().min(1),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ collection, id }, { context }) =>
				readAgentGuidelineDocument(context.user, { collection, id }),
		}),
		getCheckCatalog: tool({
			description: 'Get checks declared by published brand guideline documents.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => listAgentChecks(context.user),
		}),
		listCheckScenarios: tool({
			description:
				'List supported image quality check scenarios and their scenarioKey values.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: async (_input, { context }) =>
				(await getCheckScenarios(context.user as User)).map(({ key, title }) => ({
					key,
					title,
				})),
		}),
		findTemplatesForRequest: tool({
			description:
				'Find or list published production templates, their template checks, and their open slots for asset creation requests or questions about what templates/assets can be made.',
			inputSchema: z.object({
				query: z.string().min(1).max(120).optional(),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ query }, { context }) => findTemplatesForRequest(context.user, query),
		}),
		prepareTemplateImage: tool({
			description:
				'Prepare a chat attachment from a published template and slot values. Only open slots can be changed.',
			inputSchema: z.object({
				templateId: z.number().int().positive(),
				values: z.record(z.string(), templateSlotValueSchema),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ templateId, values }, { context }) =>
				prepareTemplateImage(context.user, templateId, values),
		}),
		generateImage: tool({
			description: `Generate NEW images from a text prompt using AI image generation. Use when the user wants to create or generate a fresh image from a description (배경, 풍경, 제품컷, 헤더 이미지 등). This is DIFFERENT from prepareTemplateImage, which only fills fixed templates like 명함/카드. For a branded cosmetic PRODUCT shot, the prompt describes the hero product and sceneId picks the brand environment/composition (omit to auto-pick). For any NON-product image (backgrounds, textures, key visuals, 자유 생성), pass sceneId "free" to generate the prompt as-is without brand product styling. Scenes: ${imageSceneSummary}.`,
			inputSchema: z.object({
				prompt: z.string().min(1).max(500),
				sceneId: z.string().max(40).optional(),
				count: z.number().int().min(1).max(4).optional(),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: async ({ prompt, sceneId, count }) => {
				const {
					images,
					prompt: composedPrompt,
					sceneId: usedSceneId,
				} = await generateImageCandidates({
					userInput: prompt,
					sceneId,
					count: count ?? 2,
				})
				if (images.length === 0) {
					// 실패를 모델에 명시적으로 알린다 — 안 그러면 빈 결과에도 "만들었어"라고 답한다.
					return {
						status: 'failed',
						message:
							'이미지 생성에 실패했어요. 무료 엔진이 느려 그럴 수 있으니 잠시 후 다시 시도해 주세요.',
					}
				}
				return {
					type: 'generated-images',
					prompt: composedPrompt,
					sceneId: usedSceneId,
					images,
				} satisfies AgentGeneratedImagesAttachment
			},
		}),
		runCheck: tool({
			description:
				'Run a quality check on the latest image attached by the user in this chat. Use listCheckScenarios first when the matching scenarioKey is unknown.',
			inputSchema: z.object({
				scenarioKey: z.string().min(1).max(80).optional(),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: async ({ scenarioKey }, { context, messages }) => {
				const scenarios = await getCheckScenarios(context.user as User)
				const scenario = getCheckScenario(scenarios, scenarioKey)
				const image = findLatestImage(messages)

				if (!image) {
					return {
						status: 'missing-image',
						message: '검수할 이미지 첨부가 없습니다.',
						scenarios: scenarios.map(({ key, title }) => ({ key, title })),
					}
				}

				const result = await startCheckSession({
					agentChatSessionId: context.agentChatSessionId,
					buffer: image.buffer,
					imageName: image.name,
					scenario,
					scenarioKey: scenario.key,
					source: 'chat',
					user: context.user as User,
				})

				return formatCheckToolResult(result, scenario.title)
			},
		}),
	} satisfies ToolSet
}

function formatLoadedSkill(skill: AgentSkillDetail) {
	return {
		name: skill.name,
		description: skill.description,
		instructions: formatAgentSkillInstructions(skill),
	}
}

function formatAgentSkillInstructions(skill: {
	body: string
	references?: { body: string; title: string }[] | null
}) {
	const references =
		skill.references
			?.map((reference) => `## ${reference.title}\n${reference.body}`)
			.join('\n\n') || ''

	return [skill.body, references ? `# Skill references\n\n${references}` : null]
		.filter(Boolean)
		.join('\n\n')
}

function findLatestImage(messages: unknown) {
	if (!Array.isArray(messages)) return null
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i] as { content?: unknown; role?: unknown }
		if (message.role !== 'user' || !Array.isArray(message.content)) continue
		for (let j = message.content.length - 1; j >= 0; j--) {
			const part = message.content[j] as {
				data?: unknown
				filename?: unknown
				mediaType?: unknown
				type?: unknown
				url?: unknown
			}
			if (part.type !== 'file' || typeof part.mediaType !== 'string') continue
			if (!isImageMediaType(part.mediaType)) continue
			const buffer = dataToBuffer(part.data ?? part.url)
			if (!buffer) continue
			return {
				buffer,
				name: typeof part.filename === 'string' ? part.filename : 'chat-image',
			}
		}
	}
	return null
}

function isImageMediaType(mediaType: string) {
	return mediaType === 'image' || mediaType.startsWith('image/')
}

function dataToBuffer(data: unknown): Buffer | null {
	if (Buffer.isBuffer(data)) return data
	if (data instanceof Uint8Array) return Buffer.from(data)
	if (data instanceof ArrayBuffer) return Buffer.from(data)
	if (data instanceof URL) return dataToBuffer(data.toString())
	if (typeof data === 'object' && data !== null) {
		const partData = data as { data?: unknown; url?: unknown }
		return dataToBuffer(partData.data ?? partData.url)
	}
	if (typeof data !== 'string') return null
	const base64 = data.startsWith('data:') ? data.split(',', 2)[1] : data
	return base64 ? Buffer.from(base64, 'base64') : null
}

function formatCheckToolResult(
	result: Awaited<ReturnType<typeof startCheckSession>>,
	scenarioTitle: CheckScenario['title'],
) {
	const entries = Object.entries(result.results)
	const counts = entries.reduce(
		(acc, [, value]) => {
			acc[value.rawResult.status] += 1
			return acc
		},
		{ fail: 0, needs_review: 0, ok: 0, pass: 0, advisory: 0 },
	)
	const outcome =
		counts.fail > 0
			? 'has_failed_items'
			: counts.needs_review > 0
				? 'needs_manager_check'
				: 'passed'

	return {
		checkSessionId: result.checkSessionId,
		scenario: scenarioTitle,
		counts,
		outcome,
		summary:
			outcome === 'passed'
				? `검수 결과, 통과 ${counts.pass}개 / 적합 ${counts.ok}개입니다.`
				: `검수 결과, 통과 ${counts.pass}개 / 적합 ${counts.ok}개 / 미통과 ${counts.fail}개 / 담당자 검토 필요 ${counts.needs_review}개입니다.`,
		statusLabels: {
			fail: '미통과',
			needs_review: '담당자 검토 필요',
			ok: '적합',
			pass: '통과',
			advisory: '조언',
		},
		checkGuidance: [
			'needs_review는 확정 실패가 아니라 담당자 확인이 필요한 항목입니다.',
			'타이포그래피 needs_review는 폰트 파일 판정이 아니라 비전 기준 담당자 검토로 설명합니다.',
		],
		results: entries.map(([key, value]) => {
			const status = value.rawResult.status
			return {
				key,
				isFailure: status === 'fail',
				statusLabel:
					key.startsWith('typography.') && status === 'needs_review'
						? '비전 기준 담당자 검토 필요'
						: status === 'needs_review'
							? '담당자 검토 필요'
							: status === 'ok'
								? '적합'
								: status === 'pass'
									? '통과'
									: status === 'advisory'
										? '조언'
										: '미통과',
				status,
				fulfillment: value.rawResult.fulfillment,
				detail: value.message,
			}
		}),
	}
}
