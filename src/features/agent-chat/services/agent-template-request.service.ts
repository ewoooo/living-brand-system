import { z } from 'zod'

import { pickHtmlTemplate } from '@/features/asset-generation/services/get-published-template.service'
import {
	collectHtmlSlots,
	type HtmlSlot,
} from '@/features/asset-generation/utils/collect-html-slots'
import { AgentConfigurationError } from '@/lib/errors'
import {
	AUTHORIZED_ASSET_COLLECTIONS,
	collectOpenSlotElements,
	type JsonSlotElement,
	type JsonTemplate,
	jsonTemplateSchema,
} from '@/types/json-template'
import {
	type AgentTemplateDocument,
	findAgentTemplate,
	listAgentTemplates,
} from '../repositories/agent-template.payload.repository'
import { listAgentChecks } from './get-agent-guideline-context.service'

export const templateSlotValueSchema = z.object({
	src: z.string().max(2000).optional(),
	text: z.string().max(1000).optional(),
})

type TemplateSlotValues = Record<string, z.infer<typeof templateSlotValueSchema>>

/**
 * prepareTemplateImage 툴 출력 계약 — 챗 첨부 UI가 이 타입을 그대로 소비한다 (이중 정의 금지).
 * html이 정본이고 json은 deprecated 폴백 — kind 없는 기존 저장 메시지는 json으로 읽는다.
 * 렌더 페이로드(html/template)는 toModelOutput으로 모델 컨텍스트에서 제외된다.
 */
export type AgentTemplateImageAttachment =
	| {
			type: 'template-image'
			kind: 'html'
			templateId: number
			name: string
			html: string
			width: number
			height: number
			values: TemplateSlotValues
	  }
	| {
			type: 'template-image'
			kind?: 'json'
			templateId: number
			name: string
			template: JsonTemplate
			values: TemplateSlotValues
	  }

/**
 * Agent tool의 템플릿 검색 요청을 발행 템플릿 요약 목록으로 변환한다.
 * Payload 템플릿 조회는 agent template repository가 담당한다.
 */
export async function findTemplatesForRequest(user: unknown, query?: string) {
	const [templates, checks] = await Promise.all([listAgentTemplates(user), listAgentChecks(user)])
	const checksByKey = new Map(checks.map((check) => [check.key, check]))
	const normalizedQuery = query?.trim().toLowerCase()

	const summaries = templates
		.map((template) => {
			const slots = getTemplateSlots(template)
			return slots
				? {
						id: template.id,
						name: template.name,
						description: template.description || '',
						checks: getTemplateChecks(template.templateChecks, checksByKey),
						slots,
					}
				: null
		})
		.filter((template): template is NonNullable<typeof template> => Boolean(template))

	const matches = normalizedQuery
		? summaries.filter((template) =>
				[
					template.name,
					template.description,
					...template.checks.flatMap((check) => [
						check.title,
						check.description,
						check.body,
					]),
					...template.slots.map((slot) => slot.label),
				]
					.join(' ')
					.toLowerCase()
					.includes(normalizedQuery),
			)
		: summaries

	// ponytail: 단순 부분 문자열 매칭. 0건이면 전체 목록으로 폴백해 LLM이 직접 고르게 한다.
	return (matches.length > 0 ? matches : summaries).slice(0, 10)
}

/**
 * Agent tool이 준 슬롯 값을 검증해 챗 첨부용 템플릿 이미지 데이터로 변환한다.
 * Payload 템플릿 조회는 agent template repository가 담당한다.
 */
export async function prepareTemplateImage(
	user: unknown,
	templateId: number,
	values: TemplateSlotValues,
): Promise<AgentTemplateImageAttachment> {
	const template = await findAgentTemplate(user, templateId)

	if (!template) {
		throw new AgentConfigurationError('Template is not available.')
	}

	const html = pickHtmlTemplate(template)

	if (html) {
		return {
			type: 'template-image' as const,
			kind: 'html' as const,
			templateId: template.id,
			name: template.name,
			html: html.html,
			width: html.width,
			height: html.height,
			values: filterHtmlSlotValues(collectHtmlSlots(html.html, html.overrides), values),
		}
	}

	const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)

	if (!parsed.success) {
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

function getTemplateSlots(template: AgentTemplateDocument): AgentSlotSummary[] | null {
	const html = pickHtmlTemplate(template)

	if (html) {
		return collectHtmlSlots(html.html, html.overrides).map(toHtmlSlotSummary)
	}

	const parsed = jsonTemplateSchema.safeParse(template.jsonTemplate)
	return parsed.success ? getOpenSlots(parsed.data) : null
}

function toHtmlSlotSummary(slot: HtmlSlot): AgentSlotSummary {
	return {
		id: slot.nodeId,
		label: slot.input.label ?? slot.name,
		type: 'text' as const,
		defaultText: slot.text,
		inputFormat: slot.input.inputFormat ?? 'free',
		maxLength: slot.input.maxLength,
		maxLines: slot.input.maxLines,
		aiInstruction: slot.input.aiInstruction,
	}
}

function getTemplateChecks(
	templateChecks: AgentTemplateDocument['templateChecks'],
	checksByKey: Map<string, { evidence: string; title: string }>,
) {
	return (templateChecks ?? [])
		.flatMap((placement) => {
			if (!placement.checkKey) return []
			const check = checksByKey.get(placement.checkKey)
			return [
				{
					key: placement.checkKey,
					title: check?.title ?? placement.checkKey,
					description: check?.evidence ?? '',
					body: placement.body || '',
				},
			]
		})
		.filter((check) => check.title || check.description || check.body)
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
			// 이 슬롯을 채울 때 항상 지켜야 할 규칙 (예: "영문 이름만"). 모델이 값 작성 시 따른다.
			aiInstruction?: string
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

/** HTML 슬롯은 텍스트 전용 — 선언된 슬롯의 text만 통과시키고 input 스펙(maxLength·maxLines)으로 맞춘다. */
function filterHtmlSlotValues(slots: HtmlSlot[], values: TemplateSlotValues): TemplateSlotValues {
	const result: TemplateSlotValues = {}

	for (const slot of slots) {
		const value = values[slot.nodeId]
		if (typeof value?.text !== 'string') continue

		const text = value.text.trim().slice(0, slot.input.maxLength ?? value.text.length)
		result[slot.nodeId] = {
			text: slot.input.maxLines
				? text.split('\n').slice(0, slot.input.maxLines).join('\n')
				: text,
		}
	}

	return result
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
	const text = normalizeTextSlotValue(element, value).slice(0, maxLength)

	return element.maxLines ? text.split('\n').slice(0, element.maxLines).join('\n') : text
}

function normalizeTextSlotValue(
	element: Extract<JsonSlotElement, { type: 'text' }>,
	value: string,
) {
	const text = value.trim()
	const slotText = `${element.id} ${element.slotLabel ?? ''} ${element.text}`.toLowerCase()
	const isDepartmentSlot = /부서|department|team|팀/.test(slotText)

	return isDepartmentSlot ? text.replace(/\s*(팀|team)\s*(으로|로)?$/i, '').trim() : text
}
