import {
	canExportTemplate,
	type TemplateExportFormat,
} from '@/features/template-export/services/export-template.client'
import {
	collectTemplateImageSlots,
	collectTemplateSlots,
} from '@/services/collect-template-slots.service'
import { IMAGE_EDIT_TRANSFORM_LIMITS } from '@/services/compose-template-html.client'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'

/**
 * 템플릿 하나가 스튜디오에 내는 편집 계약 — 무엇이 열려 있고(권한), 어디까지 조작
 * 가능한가(레인지), 초기값은 무엇인가. published html + nodeConfigs에서 파생되는
 * 읽기 전용 객체이고 저작 상태의 정본이 아니다(정본: html/nodeConfigs, 값 상한: compose,
 * 세션 값: TemplateStudioProvider). 외부 I/O 없음 — 순수 투영.
 */
export type TemplateConfig = {
	id: number
	/** 계약 형태 버전 — 어드민 저장·에이전트 노출로 진화할 때의 앵커. */
	version: 1
	name: string
	slots: TemplateConfigSlot[]
	exportOption: {
		formats: readonly TemplateExportFormat[]
		printPpi?: PublishedHtmlTemplate['printPpi']
		canvas: { width: number; height: number }
	}
}

export type TemplateConfigSlot = {
	/** 노드 슬롯은 nodeId, 캔버스 전체를 다루는 합성 슬롯(background)은 합성 id. */
	id: string
	/** 어드민 레이어 트리에서 슬롯이 붙은 레이어 이름. */
	layer: string
	label: string
	control: TemplateSlotControl
}

export type TransformLimits = typeof IMAGE_EDIT_TRANSFORM_LIMITS

/**
 * 슬롯이 여는 컨트롤 — kind 판별 유니언(docs/10 §3.6 컨트롤러 API 어휘 대응).
 * 리프 kind(color·select·range·toggle)는 어드민이 발급할 수 있게 되는 시점에 합류한다 —
 * 생산자 없는 유니언 멤버를 미리 넣지 않는다.
 */
export type TemplateSlotControl =
	| {
			kind: 'text'
			defaultValue: string
			format: 'free' | 'number' | 'email' | 'date'
			maxLength?: number
			maxLines?: number
			placeholder?: string
	  }
	| {
			kind: 'image'
			/** 슬롯 박스(px) — 패드 비율·생성 비율의 단일 원천. */
			box: { width?: number; height?: number }
			/** 고정 프로파일이면 읽기전용 Type 행, 없으면 사용자 선택 개방. */
			profile: { pinnedId?: number }
			/** 있으면 Line Color 개방 + 기본값. */
			colorize?: { line: string; background?: string }
			/** 레인지는 compose 전역 계약 안에서만 좁힐 수 있다 — 최종 clamp는 compose 소유. */
			transform: { enabled: boolean; limits: TransformLimits }
	  }
	| {
			kind: 'background'
			allowedTypes: readonly ('color' | 'image' | 'graphic')[]
	  }

export type TemplateTextSlot = TemplateConfigSlot & {
	control: Extract<TemplateSlotControl, { kind: 'text' }>
}
export type TemplateImageConfigSlot = TemplateConfigSlot & {
	control: Extract<TemplateSlotControl, { kind: 'image' }>
}
export type TemplateBackgroundSlot = TemplateConfigSlot & {
	control: Extract<TemplateSlotControl, { kind: 'background' }>
}

export const isTextSlot = (slot: TemplateConfigSlot): slot is TemplateTextSlot =>
	slot.control.kind === 'text'
export const isImageSlot = (slot: TemplateConfigSlot): slot is TemplateImageConfigSlot =>
	slot.control.kind === 'image'
export const isBackgroundSlot = (slot: TemplateConfigSlot): slot is TemplateBackgroundSlot =>
	slot.control.kind === 'background'

/** published 템플릿에서 편집 계약을 파생한다 — 어드민이 계약을 직접 저장하게 되면 이 함수가 그 폴백이 된다. */
export function deriveTemplateConfig(template: PublishedHtmlTemplate): TemplateConfig {
	const { html, nodeConfigs } = template
	const slots: TemplateConfigSlot[] = [
		...collectTemplateSlots(html, nodeConfigs).map(
			(slot): TemplateConfigSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.input.label ?? slot.name,
				control: {
					kind: 'text',
					defaultValue: slot.text,
					format: slot.input.inputFormat ?? 'free',
					maxLength: slot.input.maxLength,
					maxLines: slot.input.maxLines,
					placeholder: slot.input.placeholder,
				},
			}),
		),
		...collectTemplateImageSlots(html, nodeConfigs).map(
			(slot): TemplateConfigSlot => ({
				id: slot.nodeId,
				layer: slot.name,
				label: slot.name,
				control: {
					kind: 'image',
					box: { width: slot.boxWidth, height: slot.boxHeight },
					profile: { pinnedId: slot.profileId },
					colorize: nodeConfigs[slot.nodeId]?.imageColorize,
					// 어드민이 레인지를 좁히는 필드가 생기기 전까지는 전역 계약이 그대로 슬롯 레인지다.
					transform: { enabled: true, limits: IMAGE_EDIT_TRANSFORM_LIMITS },
				},
			}),
		),
		{
			id: 'background',
			layer: 'background',
			label: 'Background',
			// 어드민이 배경 개방을 좁히는 필드가 생기기 전까지는 전 템플릿이 세 종류를 연다.
			control: { kind: 'background', allowedTypes: ['color', 'image', 'graphic'] },
		},
	]

	return {
		id: template.id,
		version: 1,
		name: template.name,
		slots,
		exportOption: {
			formats: (['png', 'tiff', 'pdf'] as const).filter((format) =>
				canExportTemplate(format, {
					fileName: template.name,
					height: template.height,
					html: template.html,
					printPpi: template.printPpi,
					templateId: template.id,
					templateVersion: template.templateVersion,
					width: template.width,
				}),
			),
			printPpi: template.printPpi,
			canvas: { width: template.width, height: template.height },
		},
	}
}
