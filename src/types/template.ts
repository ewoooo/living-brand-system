import type { TemplateVectorAssetCollection } from '@/services/template-asset-policy.service'

/** Creator가 편집할 수 있는 텍스트 슬롯의 제약과 작성 지침. */
export interface TemplateSlotSpec {
	label?: string
	placeholder?: string
	maxLength?: number
	maxLines?: number
	inputFormat?: 'free' | 'number' | 'email' | 'date'
	aiInstruction?: string
}

/** Template의 nodeId 하나에 저장하는 앱 편집 설정. */
export interface TemplateNodeConfig {
	text?: string
	backgroundImage?: string
	generatedImageId?: number
	/** 프레임에 할당한 이미지의 자유 편집 — 이동(px)·확대(배율)·회전(deg). 캐리어에만 적용된다. */
	imageTransform?: { x: number; y: number; scale: number; rotate: number }
	input?: TemplateSlotSpec
	vectorAsset?: {
		collection: TemplateVectorAssetCollection
		id: number
		src: string
	}
	vectorFit?: 'fill' | 'contain'
	vectorColor?: string
}

/** DB의 overrides 필드가 저장하는 nodeId → 노드 설정 map. */
export type TemplateNodeConfigMap = Record<string, TemplateNodeConfig>
