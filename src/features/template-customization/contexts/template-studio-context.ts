'use client'

import { createContext, type RefObject } from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { ImageTransformValue } from '@/features/template-customization/domain/image-edit-transform'
import type {
	ResolvedTemplateImageConfig,
	TemplateBackgroundType,
	TemplateStudioConfig,
	TemplateVectorSlot,
} from '@/features/template-customization/domain/template-studio-config'
import type { TemplateRasterArtifact } from '@/features/template-customization/runtime/template-runtime.client'
import type { GetCreateNavigationOutput } from '@/features/template-customization/services/get-create-navigation.service'
import type { LazyResource } from '@/hooks/use-lazy-resource'
import type {
	ControllerControlValue,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

/**
 * 슬롯이나 배경에 배정된 이미지. 출처가 다르면 뒤따르는 규칙이 달라 kind로 가른다 —
 * 생성 이미지는 만든 프로파일을 기억해 색 치환을 열고, 샘플 이미지는 그대로 얹기만 한다.
 */
export type TemplateAssignedImage =
	| { kind: 'generated'; url: string; generatedImageId: number; profileId: number }
	| { kind: 'sample'; url: string; sampleImageId: number }

/** 이미지 슬롯 하나의 입력·요청·결과 상태. 슬롯 단위를 쪼개지 않고 한 객체로 흐른다. */
export type TemplateImageSlotState = {
	profileId?: number
	prompt: string
	generating: boolean
	error: string | null
	featureValues: ControllerValues
	/** 배정된 이미지 — 없으면 슬롯은 저작 이미지 그대로다(transform도 잠긴다). */
	image?: TemplateAssignedImage
	transform?: ImageTransformValue
}

export type TemplateImageSlotPatch = Partial<Pick<TemplateImageSlotState, 'prompt' | 'transform'>>

/** 캔버스 배경 하나의 입력·요청·결과 상태. */
export type TemplateBackgroundState = {
	type: TemplateBackgroundType
	imageMode: 'preset' | 'generate'
	color: string | null
	profileId?: number
	prompt: string
	generating: boolean
	error: string | null
	featureValues: ControllerValues
	graphicConfigId?: string
	graphicValues: ControllerValues
	/** 깔린 배경 이미지 — type=image일 때만 합성된다. */
	image?: TemplateAssignedImage
}

export type TemplateBackgroundPatch = Partial<Pick<TemplateBackgroundState, 'imageMode' | 'prompt'>>

export type TemplateStudioValue = {
	navigation: {
		/** 현재 템플릿이 속한 카테고리 이름 — 식별 카드의 부제다. 목록 없이도 알아야 해서 서버가 함께 내린다. */
		categoryTitle: string | null
		/** 교체 후보 — 자산 브라우저가 열릴 때 가져온다. 열기 전에는 data가 null이다. */
		browse: LazyResource<GetCreateNavigationOutput['categories']>
	}
	/** 템플릿 편집 계약 — Sidebar와 Canvas는 이 객체와 세션 state만 소비한다. */
	config: TemplateStudioConfig
	text: {
		values: Record<string, string>
		setValue: (slotId: string, text: string) => void
		color: string | null
		setColor: (hex: string | null) => void
		clippedSlotIds: ReadonlySet<string>
	}
	images: {
		states: Record<string, TemplateImageSlotState>
		contracts: Record<string, readonly ResolvedTemplateImageConfig[]>
		update: (slotId: string, patch: TemplateImageSlotPatch) => void
		updateFeature: (slotId: string, controlId: string, value: ControllerControlValue) => void
		selectProfile: (slotId: string, profileId: number) => void
		generate: (slotId: string) => Promise<void>
	}
	vectors: {
		slots: readonly TemplateVectorSlot[]
		colors: Record<string, string | undefined>
		setColor: (slotId: string, color: string) => void
	}
	layers: {
		visibility: Record<string, boolean>
		setVisible: (slotId: string, visible: boolean) => void
	}
	background: {
		state: TemplateBackgroundState
		contracts: readonly ResolvedTemplateImageConfig[]
		featureBindings: ControllerRuntimeBindings
		graphicConfigs: readonly GraphicStudioConfig[]
		graphicBindings: ControllerRuntimeBindings
		update: (patch: TemplateBackgroundPatch) => void
		setColor: (hex: string | null) => void
		selectType: (value: ControllerControlValue) => void
		updateFeature: (controlId: string, value: ControllerControlValue) => void
		selectImageProfile: (profileId: number) => void
		selectGraphicConfig: (configId: string) => void
		updateGraphic: (controlId: string, value: ControllerControlValue) => void
		generate: () => Promise<void>
	}
	canvas: {
		html: string
		artifact: () => TemplateRasterArtifact
		previewRef: RefObject<HTMLDivElement | null>
		registerGraphicFrame: (capture: (() => string) | null) => void
	}
	execution: {
		controllerValues: ControllerValues
	}
}

export const TemplateStudioContext = createContext<TemplateStudioValue | null>(null)
