import type {
	AuthorizedTemplateAssetCollection,
	TemplateVectorAssetCollection,
} from '@/features/template-core/domain/template-asset-policy'

/** Creator가 편집할 수 있는 텍스트 슬롯의 제약과 작성 지침. */
export interface TemplateSlotSpec {
	label?: string
	placeholder?: string
	maxLength?: number
	maxLines?: number
	inputFormat?: 'free' | 'number' | 'email' | 'date'
	aiInstruction?: string
}

export type TemplateLayerAccess = 'hidden' | 'readonly' | 'editable'

export interface TemplateLayerCreatorPolicy {
	access: TemplateLayerAccess
	visibility?: {
		defaultVisible?: boolean
		allowToggle?: boolean
	}
}

/** Template의 nodeId 하나에 저장하는 앱 편집 설정. */
export interface TemplateNodeConfig {
	/** Admin이 정하는 Creator 노출·편집·visibility 정책. */
	creator?: TemplateLayerCreatorPolicy
	/** Creator 세션이 compose에만 싣는 실제 표시 상태. Admin 저장 정책과 분리한다. */
	visible?: boolean
	text?: string
	/** 텍스트 노드(<p>)의 색 오버라이드 — 스튜디오 일괄 텍스트 색이 compose 시점에만 싣는 값(저장 안 됨). */
	color?: string
	backgroundImage?: string
	/** Admin이 노드에 붙여 저장하는 생성 이미지 참조. 저장 검증이 발행 조건으로 요구한다. */
	generatedImageId?: number
	/**
	 * Creator 세션이 compose에만 싣는 자산 참조(저장 안 됨). 생성 이미지든 샘플 이미지든
	 * 같은 자리를 쓴다 — 컬렉션이 값에 들어 있어 출처가 늘어도 이 계약은 그대로다.
	 * 없으면 compose가 generatedImageId로 물러난다.
	 */
	assetRef?: { collection: AuthorizedTemplateAssetCollection; id: number }
	/** 프레임에 할당한 이미지의 자유 편집 — 이동(px)·확대(배율)·회전(deg). 캐리어에만 적용된다. */
	imageTransform?: { x: number; y: number; scale: number; rotate: number }
	/**
	 * 생성 이미지(단색 라인 아트)의 브랜드 컬러 치환 — 이미지가 luminance 마스크가 되어
	 * 밝은 영역=background, 어두운 선=line으로 칠해진다. 기존 이미지와 교체 이미지에 모두 적용된다.
	 * background 생략 = 배경 투명(선만 칠해지고 캔버스가 비침).
	 */
	imageColorize?: { line: string; background?: string }
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
