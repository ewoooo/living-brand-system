import type { TemplateVectorAssetCollection } from '@/features/template-core/domain/template-asset-policy'

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
	/** 텍스트 노드(<p>)의 색 오버라이드 — 스튜디오 일괄 텍스트 색이 compose 시점에만 싣는 값(저장 안 됨). */
	color?: string
	backgroundImage?: string
	generatedImageId?: number
	/** 프레임에 할당한 이미지의 자유 편집 — 이동(px)·확대(배율)·회전(deg). 캐리어에만 적용된다. */
	imageTransform?: { x: number; y: number; scale: number; rotate: number }
	/**
	 * 생성 이미지(단색 라인 아트)의 브랜드 컬러 치환 — 이미지가 luminance 마스크가 되어
	 * 밝은 영역=background, 어두운 선=line으로 칠해진다. backgroundImage 없이는 compose가 무시한다.
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
