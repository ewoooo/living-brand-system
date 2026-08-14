'use client'

import { getImageColorAdjustmentControls } from '@/features/image-generation/domain/image-studio-config'
import { composeTemplateHtml } from '@/features/template-core/runtime/compose-template-html.client'
import {
	type ImageTransformValue,
	toImageEditTransform,
} from '@/features/template-customization/domain/image-edit-transform'
import type {
	ResolvedTemplateImageConfig,
	TemplateBackgroundType,
	TemplateImageConfigSlot,
	TemplateTextSlot,
	TemplateVectorSlot,
} from '@/features/template-customization/domain/template-studio-config'
import type {
	RasterArtifact,
	StudioArtifactProducer,
} from '@/modules/studio-artifact/studio-artifact'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import type { TemplateNodeConfigMap } from '@/types/template'
import { withTemplateRasterStage } from './render-template-raster-stage.client'

export type TemplateRasterArtifactSource = {
	height: number
	html: string
	width: number
}

export type TemplateRasterArtifact = RasterArtifact
export type TemplateRasterArtifactProducer = StudioArtifactProducer<TemplateRasterArtifact>

/** 현재 Template runtime 결과를 파일 형식과 무관한 Raster Artifact로 만든다. */
export function createTemplateRasterArtifact(
	source: TemplateRasterArtifactSource,
): TemplateRasterArtifact {
	return {
		kind: 'raster',
		source: {
			withSurface: (_options, consume) =>
				withTemplateRasterStage(source.html, (element) =>
					consume({
						kind: 'element',
						element,
						width: source.width,
						height: source.height,
					}),
				),
		},
	}
}

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
	vectorSlots,
	vectorColors,
	layerVisibility,
	background,
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
	vectorSlots: readonly TemplateVectorSlot[]
	vectorColors: Readonly<Record<string, string | undefined>>
	layerVisibility: Readonly<Record<string, boolean>>
	background: {
		type: TemplateBackgroundType
		color: string | null
		image?: { url: string }
	}
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
			const slot = imageSlots.find((candidate) => candidate.id === slotId)
			const contract = imageContracts[slotId]?.find(
				(candidate) => candidate.config.id === state.profileId,
			)
			const colorControls =
				contract && (!state.image || state.image.profileId === state.profileId)
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
			const override = {
				...(colorize ? { imageColorize: colorize } : {}),
				...(state.image && state.transform
					? {
							imageTransform: toImageEditTransform(
								state.transform,
								slot?.box.width ?? width,
								slot?.box.height ?? height,
							),
						}
					: {}),
				...(state.image
					? {
							backgroundImage: state.image.backgroundImage,
							generatedImageId: state.image.generatedImageId,
						}
					: {}),
			}
			return Object.keys(override).length ? [[slotId, override] as const] : []
		}),
	)
	const vectorOverrides = Object.fromEntries(
		vectorSlots.flatMap((slot) => {
			const vectorColor = vectorColors[slot.id]
			return vectorColor ? [[slot.id, { vectorColor }] as const] : []
		}),
	)
	const visibilityOverrides = Object.fromEntries(
		Object.entries(layerVisibility).map(([slotId, visible]) => [slotId, { visible }]),
	)
	const canvasBackground = {
		...(background.type === 'graphic' ? { clear: true } : {}),
		...(background.type === 'color' && background.color ? { color: background.color } : {}),
		...(background.type === 'image' && background.image
			? { imageUrl: background.image.url }
			: {}),
	}
	return composeTemplateHtml(
		html,
		mergeTemplateOverrides(textOverrides, imageOverrides, vectorOverrides, visibilityOverrides),
		{ canvasBackground },
	)
}

function mergeTemplateOverrides(...maps: readonly TemplateNodeConfigMap[]): TemplateNodeConfigMap {
	const merged: TemplateNodeConfigMap = {}
	for (const map of maps) {
		for (const [id, value] of Object.entries(map)) merged[id] = { ...merged[id], ...value }
	}
	return merged
}
