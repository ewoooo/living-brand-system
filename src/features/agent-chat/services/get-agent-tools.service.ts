import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import {
	type AgentSkillDetail,
	findEnabledAgentSkillByName,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { AgentConfigurationError } from '@/lib/errors'
import type { User } from '@/payload-types'
import {
	CHECK_SCENARIOS,
	getCheckScenario,
	startCheckSession,
} from '@/services/start-check-session.service'
import { findAgentRules } from '../repositories/agent-guideline-context.payload.repository'
import {
	findTemplatesForRequest,
	prepareTemplateImage,
	templateSlotValueSchema,
} from './agent-template-request.service'
import {
	listAgentGuidelinePages,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from './get-agent-guideline-context.service'

export type { AgentTemplateImageAttachment } from './agent-template-request.service'

const guidelineToolContextSchema = z.object({
	user: z.unknown(),
})

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
		listGuidelinePages: tool({
			description: 'List published brand guideline sections and pages available to read.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => listAgentGuidelinePages(context.user),
		}),
		searchGuidelines: tool({
			description: 'Search published brand guideline pages and sections.',
			inputSchema: z.object({
				query: z.string().min(1).max(120),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ query }, { context }) => searchAgentGuidelines(context.user, { query }),
		}),
		readGuidelineDocument: tool({
			description: 'Read a published guideline page or section returned by searchGuidelines.',
			inputSchema: z.object({
				collection: z.enum(['guideline-pages', 'sections']),
				id: z.string().min(1),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: ({ collection, id }, { context }) =>
				readAgentGuidelineDocument(context.user, { collection, id }),
		}),
		getRuleCatalog: tool({
			description: 'Get the live built-in rule preset catalog registered in Payload.',
			inputSchema: z.object({}),
			contextSchema: guidelineToolContextSchema,
			execute: (_input, { context }) => findAgentRules(context.user),
		}),
		findTemplatesForRequest: tool({
			description:
				'Find or list published production templates, their template rules, and their open slots for asset creation requests or questions about what templates/assets can be made.',
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
		runCheck: tool({
			description:
				'Run a quality check on the latest image attached by the user in this chat. Use when the user asks to inspect, validate, or check an attached image.',
			inputSchema: z.object({
				scenarioKey: z.string().min(1).max(80).optional(),
			}),
			contextSchema: guidelineToolContextSchema,
			execute: async ({ scenarioKey }, { context, messages }) => {
				const scenario = getCheckScenario(scenarioKey)
				const image = findLatestImage(messages)

				if (!image) {
					return {
						status: 'missing-image',
						message: '검수할 이미지 첨부가 없습니다.',
						scenarios: CHECK_SCENARIOS.map(({ key, title }) => ({ key, title })),
					}
				}

				const result = await startCheckSession({
					buffer: image.buffer,
					flags: scenario.flags,
					imageName: image.name,
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
	scenarioTitle: string,
) {
	const entries = Object.entries(result.results)
	const counts = entries.reduce(
		(acc, [, value]) => {
			acc[value.rawResult.status] += 1
			return acc
		},
		{ fail: 0, needs_review: 0, ok: 0, pass: 0 },
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
									: '미통과',
				status,
				fulfillment: value.rawResult.fulfillment,
				detail: value.message,
			}
		}),
	}
}
