import type { FigmaNode, FigmaPaint } from '@/features/template-import/types'

/**
 * Figma 변환 파이프라인의 공유 어휘.
 *
 * FigmaSourceNode(소스 모델) → IrNode(중간 표현) → HTML 문자열 순서로 흐른다.
 * - 소스 모델: REST /nodes 응답에서 변환이 소비하는 필드의 실질적 명세. 레거시/신형 필드가 섞여 있다.
 * - IR: "무엇을 어떤 태그·스타일로 그릴지" 판단이 끝난 상태. 방출(emit)은 IR을 기계적으로 문자열화만 한다.
 * 이 파일은 타입만 소유한다 — 로직은 normalize(판단)·lower(스타일 변환)·emit(방출)이 나눠 갖는다.
 */

/** 텍스트 노드 style 필드의 확장 — types.ts의 최소 형태에 변환이 추가로 읽는 타이포 필드를 더한다. */
export type FigmaTextStyle = NonNullable<FigmaNode['style']> & {
	italic?: boolean
	fontStyle?: string
	textCase?: string
	textDecoration?: string
	lineHeightUnit?: string
	lineHeightPercentFontSize?: number
}

/** 소스 모델: FigmaNode에 변환이 소비하는 시각/레이아웃 필드를 확장한 형태. 트리 전체가 이 타입으로 흐른다. */
export interface FigmaSourceNode extends Omit<FigmaNode, 'style'> {
	style?: FigmaTextStyle
	background?: FigmaPaint[]
	backgroundColor?: { r: number; g: number; b: number; a?: number }
	opacity?: number
	rotation?: number
	blendMode?: string
	clipsContent?: boolean
	cornerRadius?: number
	rectangleCornerRadii?: number[]
	strokes?: FigmaPaint[]
	strokeWeight?: number
	individualStrokeWeights?: { top: number; right: number; bottom: number; left: number }
	// 레이아웃 컨테이너
	itemSpacing?: number
	counterAxisSpacing?: number
	counterAxisAlignContent?: string
	layoutWrap?: string
	gridColumnGap?: number
	gridRowGap?: number
	gridColumnsSizing?: string
	gridRowsSizing?: string
	gridItemsPositioning?: string
	// 자식 배치
	gridColumnAnchorIndex?: number
	gridRowAnchorIndex?: number
	gridColumnSpan?: number
	gridRowSpan?: number
	gridChildHorizontalAlign?: string
	gridChildVerticalAlign?: string
	children?: FigmaSourceNode[]
}

/** CSS 선언 묶음. 값이 undefined/빈 문자열인 키는 방출 시 걸러진다. */
export type IrCssStyle = Record<string, string | undefined>

/** Figma 렌더 API로 구워 저장한 에셋 참조. img 태그의 src와 data-asset-* 속성이 된다. */
export interface FigmaRenderedAsset {
	collection: 'application-images'
	id: number
	url: string
}

/**
 * 중간 표현 노드. normalize가 모든 판단(태그 선택, 스타일 병합, 비가시 노드 제거)을 끝낸 결과라서
 * emit은 이 트리를 문자열로 옮기기만 하면 된다.
 * - tag 'img'(렌더 에셋)면 children은 항상 비어 있고 asset이 존재한다.
 * - tag 'p'(텍스트)면 text가 내용을 담는다(이스케이프 전 원문).
 */
export interface IrNode {
	id: string
	name: string
	figmaType: string
	tag: 'div' | 'p' | 'img'
	style: IrCssStyle
	text?: string
	asset?: FigmaRenderedAsset
	children: IrNode[]
}
