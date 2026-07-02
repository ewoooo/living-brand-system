import { type ToolSet, tool } from 'ai'
import { z } from 'zod'

import {
	type AgentSkillDetail,
	findEnabledAgentSkillByName,
} from '@/features/agent-chat/repositories/agent-skill.payload.repository'
import { AgentConfigurationError } from '@/lib/errors'
import {
	AUTHORIZED_ASSET_COLLECTIONS,
	collectOpenSlotElements,
	type JsonSlotElement,
	type JsonTemplate,
	jsonTemplateSchema,
} from '@/types/json-template'
import { findAgentRules } from '../repositories/agent-guideline-context.payload.repository'
import {
	findAgentTemplate,
	listAgentTemplates,
} from '../repositories/agent-template.payload.repository'
import {
	listAgentGuidelinePages,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from './get-agent-guideline-context.service'

const guidelineToolContextSchema = z.object({
	user: z.unknown(),
})

const templateSlotValueSchema = z.object({
	src: z.string().max(2000).optional(),
	text: z.string().max(1000).optional(),
})

/** prepareTemplateImage 툴 출력 계약 — 챗 첨부 UI가 이 타입을 그대로 소비한다 (이중 정의 금지). */
export interface AgentTemplateImageAttachment {
	type: 'template-image'
	templateId: number
	name: string
	template: JsonTemplate
	values: Record<string, z.infer<typeof templateSlotValueSchema>>
}

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
				'Find published production templates and their open slots for a user asset request.',
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

async function findTemplatesForRequest(user: unknown, query?: string) {
	const templates = await listAgentTemplates(user)
	const normalizedQuery = query?.trim().toLowerCase()

	return templates
		.map((template) => {
			const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)
			return parsed.success
				? {
						id: template.id,
						name: template.name,
						description: template.description || '',
						slots: getOpenSlots(parsed.data),
					}
				: null
		})
		.filter((template): template is NonNullable<typeof template> => Boolean(template))
		.filter((template) => {
			if (!normalizedQuery) {
				return true
			}

			return [
				template.name,
				template.description,
				...template.slots.map((slot) => slot.label),
			]
				.join(' ')
				.toLowerCase()
				.includes(normalizedQuery)
		})
		.slice(0, 10)
}

async function prepareTemplateImage(
	user: unknown,
	templateId: number,
	values: Record<string, z.infer<typeof templateSlotValueSchema>>,
): Promise<AgentTemplateImageAttachment> {
	const template = await findAgentTemplate(user, templateId)
	const parsed = jsonTemplateSchema.safeParse(template?.jsonTemplate)

	if (!template || !parsed.success) {
		throw new AgentConfigurationError('Template is not available.')
	}

	return {
		type: 'template-image' as const,
		templateId: template.id,
		name: template.name,
		template: parsed.data,
		values: filterSlotValues(parsed.data, values),
	}
}

type AgentSlotSummary =
	| {
			id: string
			label: string
			type: 'text'
			defaultText: string
			inputFormat: 'free' | 'number' | 'email' | 'date'
			maxLength: number | undefined
			maxLines: number | undefined
	  }
	| { id: string; label: string; type: 'image' }

function getOpenSlots(template: JsonTemplate): AgentSlotSummary[] {
	// 스택 자식 슬롯까지 포함해야 하므로 반드시 공유 수집기를 쓴다 (순회 규칙 단일화).
	return collectOpenSlotElements(template.elements).flatMap((element): AgentSlotSummary[] => {
		if (element.type === 'text') {
			return [
				{
					id: element.id,
					label: element.slotLabel ?? element.id,
					type: 'text' as const,
					defaultText: element.text,
					inputFormat: element.inputFormat,
					maxLength: element.maxLength,
					maxLines: element.maxLines,
				},
			]
		}
		if (element.type === 'image') {
			return [
				{
					id: element.id,
					label: element.slotLabel ?? element.id,
					type: 'image' as const,
				},
			]
		}

		return []
	})
}

/** LLM이 준 이미지 src는 인가 에셋 컬렉션의 same-origin 경로만 허용한다 — 외부 URL은 브랜드 통제 우회이자 유출 채널이다. */
function isAuthorizedAssetSrc(src: string): boolean {
	return AUTHORIZED_ASSET_COLLECTIONS.some((collection) => src.startsWith(`/api/${collection}/`))
}

function filterSlotValues(
	template: JsonTemplate,
	values: Record<string, z.infer<typeof templateSlotValueSchema>>,
) {
	const result: Record<string, z.infer<typeof templateSlotValueSchema>> = {}

	for (const element of collectOpenSlotElements(template.elements)) {
		if (!(element.id in values)) {
			continue
		}

		const value = values[element.id]

		if (element.type === 'text' && typeof value.text === 'string') {
			result[element.id] = { text: fitTextValue(element, value.text) }
			continue
		}

		if (
			element.type === 'image' &&
			typeof value.src === 'string' &&
			isAuthorizedAssetSrc(value.src)
		) {
			result[element.id] = { src: value.src }
		}
	}

	return result
}

function fitTextValue(element: Extract<JsonSlotElement, { type: 'text' }>, value: string) {
	const maxLength = element.maxLength ?? value.length
	const text = value.slice(0, maxLength)

	return element.maxLines ? text.split('\n').slice(0, element.maxLines).join('\n') : text
}
