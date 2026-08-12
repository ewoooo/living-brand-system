import { z } from 'zod'
import { type PrintPpi, parsePrintPpi } from '@/features/template-export/print-policy'
import {
	deriveTemplateConfig,
	type TemplateConfig,
} from '@/features/template-studio/template-config'
import { AgentConfigurationError } from '@/lib/errors'
import { collectTemplateSlots, type TemplateSlot } from '@/services/collect-template-slots.service'
import { projectTemplateRenderModel } from '@/services/project-template-render-model.service'
import {
	type AgentTemplateDocument,
	findAgentTemplate,
	listAgentTemplates,
} from '../repositories/agent-template.payload.repository'

export const templateSlotValueSchema = z.object({
	text: z.string().max(1000).optional(),
})

type TemplateSlotValues = Record<string, z.infer<typeof templateSlotValueSchema>>

/**
 * prepareTemplateImage 툴 출력 계약 — 챗 첨부 UI가 이 타입을 그대로 소비한다 (이중 정의 금지).
 * 렌더 페이로드(html)는 toModelOutput으로 모델 컨텍스트에서 제외된다.
 */
export type AgentTemplateImageAttachment = {
	type: 'template-image'
	kind: 'html'
	templateId: number
	name: string
	html: string
	width: number
	height: number
	printPpi?: PrintPpi
	templateVersion?: string
	values: TemplateSlotValues
	output: TemplateConfig['output']
	controller: TemplateConfig['controller']
}

/**
 * Agent tool의 템플릿 검색 요청을 발행 템플릿 요약 목록으로 변환한다.
 * Payload 템플릿 조회는 agent template repository가 담당한다.
 */
export async function findTemplatesForRequest(user: unknown, query?: string) {
	const templates = await listAgentTemplates(user)
	const normalizedQuery = query?.trim().toLowerCase()

	const summaries = templates
		.map((template) => {
			const slots = getTemplateSlots(template)
			return slots
				? {
						id: template.id,
						name: template.name,
						description: template.description || '',
						slots,
					}
				: null
		})
		.filter((template): template is NonNullable<typeof template> => Boolean(template))

	const matches = normalizedQuery
		? summaries.filter((template) =>
				[template.name, template.description, ...template.slots.map((slot) => slot.label)]
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

	const renderModel = projectTemplateRenderModel(template)

	if (!renderModel) throw new AgentConfigurationError('Template is not available.')

	const studioConfig = deriveTemplateConfig({
		kind: 'html',
		id: template.id,
		name: template.name,
		html: renderModel.html,
		nodeConfigs: renderModel.nodeConfigs,
		width: renderModel.width,
		height: renderModel.height,
		printPpi: parsePrintPpi(template.printPpi),
		templateVersion: template.updatedAt,
		controller: template.controller,
		controllerOverride: template.controllerOverride,
		output: template.output as never,
	})
	return {
		type: 'template-image' as const,
		kind: 'html' as const,
		templateId: template.id,
		name: template.name,
		html: renderModel.html,
		width: renderModel.width,
		height: renderModel.height,
		printPpi: parsePrintPpi(template.printPpi),
		templateVersion: template.updatedAt,
		output: studioConfig.output,
		controller: studioConfig.controller,
		values: filterTemplateSlotValues(
			collectTemplateSlots(renderModel.html, renderModel.nodeConfigs),
			values,
		),
	}
}

function getTemplateSlots(template: AgentTemplateDocument): AgentSlotSummary[] | null {
	const renderModel = projectTemplateRenderModel(template)
	return renderModel
		? collectTemplateSlots(renderModel.html, renderModel.nodeConfigs).map(toTemplateSlotSummary)
		: null
}

function toTemplateSlotSummary(slot: TemplateSlot): AgentSlotSummary {
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

type AgentSlotSummary = {
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

/** HTML 슬롯은 텍스트 전용 — 선언된 슬롯의 text만 통과시키고 input 스펙(maxLength·maxLines)으로 맞춘다. */
function filterTemplateSlotValues(
	slots: TemplateSlot[],
	values: TemplateSlotValues,
): TemplateSlotValues {
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
