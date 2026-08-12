'use client'

import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import { renderGraphicStudioSvg } from '@/features/graphic-studio/graphic-studio-runtime'
import { getImageColorAdjustmentControls } from '@/features/image-studio/image-studio-config'
import type { ControllerValues } from '@/features/studio-controller/controller-definition'
import {
	type ImageTransformValue,
	toImageEditTransform,
} from '@/features/template-studio/image-edit-transform'
import type {
	ResolvedTemplateImageConfig,
	TemplateBackgroundType,
	TemplateImageConfigSlot,
	TemplateTextSlot,
} from '@/features/template-studio/template-config'
import { composeTemplateHtml } from '@/services/compose-template-html.client'

/**
 * Template runtime projector: 불변 published HTML과 현재 세션 IR을 합성 HTML로 투영한다.
 * 외부 I/O는 없고 실제 DOM 문자열 합성은 compose-template-html client adapter가 소유한다.
 */
export function composeTemplateStudioHtml({
	html,
	textSlots,
	textValues,
	textColor,
	imageStates,
	imageSlots,
	imageContracts,
	background,
	graphicConfigs,
	width,
	height,
}: {
	html: string
	textSlots: readonly TemplateTextSlot[]
	textValues: Readonly<Record<string, string>>
	textColor: string | null
	imageStates: Readonly<
		Record<
			string,
			{
				profileId?: number
				featureValues: ControllerValues
				image?: { backgroundImage: string; generatedImageId: number; profileId: number }
				transform?: ImageTransformValue
			}
		>
	>
	imageSlots: readonly TemplateImageConfigSlot[]
	imageContracts: Readonly<Record<string, readonly ResolvedTemplateImageConfig[]>>
	background: {
		type: TemplateBackgroundType
		color: string | null
		image?: { url: string }
		graphicConfigId?: string
		graphicValues: ControllerValues
	}
	graphicConfigs: readonly GraphicStudioConfig[]
	width: number
	height: number
}): string {
	const textOverrides = Object.fromEntries(
		textSlots.flatMap((slot) => {
			const override: { text?: string; color?: string } = {}
			const text = textValues[slot.id]
			if (text !== undefined) override.text = text
			if (textColor) override.color = textColor
			return Object.keys(override).length > 0 ? [[slot.id, override] as const] : []
		}),
	)
	const imageOverrides = Object.fromEntries(
		Object.entries(imageStates).flatMap(([slotId, state]) => {
			if (!state.image) return []
			const slot = imageSlots.find((candidate) => candidate.id === slotId)
			const contract = imageContracts[slotId]?.find(
				(candidate) => candidate.config.id === state.profileId,
			)
			const colorControls =
				contract && state.image.profileId === state.profileId
					? getImageColorAdjustmentControls(contract.config)
					: null
			const lineColor = colorControls ? state.featureValues[colorControls.line.id] : undefined
			const backgroundColor = colorControls?.background
				? state.featureValues[colorControls.background.id]
				: undefined
			const colorize =
				typeof lineColor === 'string'
					? {
							line: lineColor,
							...(typeof backgroundColor === 'string'
								? { background: backgroundColor }
								: {}),
						}
					: undefined
			return [
				[
					slotId,
					{
						...(colorize ? { imageColorize: colorize } : {}),
						...(state.transform
							? {
									imageTransform: toImageEditTransform(
										state.transform,
										slot?.box.width ?? width,
										slot?.box.height ?? height,
									),
								}
							: {}),
						backgroundImage: state.image.backgroundImage,
						generatedImageId: state.image.generatedImageId,
					},
				] as const,
			]
		}),
	)
	const graphicConfig = graphicConfigs.find(
		(candidate) => candidate.id === background.graphicConfigId,
	)
	const graphicSvg =
		background.type === 'graphic' && graphicConfig
			? renderGraphicStudioSvg(graphicConfig, background.graphicValues, { width, height })
			: null
	const canvasBackground = {
		...(background.type === 'color' && background.color ? { color: background.color } : {}),
		...(background.type === 'image' && background.image
			? { imageUrl: background.image.url }
			: {}),
		...(graphicSvg ? { imageUrl: toSvgDataUrl(graphicSvg) } : {}),
	}
	return composeTemplateHtml(html, { ...textOverrides, ...imageOverrides }, { canvasBackground })
}

function toSvgDataUrl(svg: string) {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
