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
	/** 존재 자체가 스튜디오 개방 선언 — 유저가 이 프레임의 이미지를 생성해 채울 수 있다. profileId는 사용할 프로파일 고정(없으면 유저가 선택). */
	imageInput?: { profileId?: number }
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
