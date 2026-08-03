/** 변환기와 REST adapter가 공유하는 Figma 응답의 최소 형태다. */
export interface FigmaLayoutConstraint {
	horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE'
	vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE'
}

export interface FigmaNode {
	id: string
	name?: string
	type: string
	visible?: boolean
	isMask?: boolean
	children?: FigmaNode[]
	absoluteBoundingBox?: { x: number; y: number; width: number; height: number }
	/** HasLayoutTrait.size는 폭/높이를 x/y에 담는 REST Vector다. */
	size?: { x: number; y: number }
	relativeTransform?: [[number, number, number], [number, number, number]]
	constraints?: FigmaLayoutConstraint
	fills?: FigmaPaint[]
	strokes?: FigmaPaint[]
	effects?: FigmaEffect[]
	characters?: string
	style?: {
		fontFamily?: string
		fontSize?: number
		fontWeight?: number
		lineHeightPx?: number
		letterSpacing?: number
		textAlignHorizontal?: string
		textAlignVertical?: string
		textAutoResize?: string
	}
	cornerRadius?: number
	opacity?: number
	rotation?: number
	blendMode?: string
	layoutMode?: string
	itemSpacing?: number
	paddingTop?: number
	paddingRight?: number
	paddingBottom?: number
	paddingLeft?: number
	primaryAxisAlignItems?: string
	counterAxisAlignItems?: string
	layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL'
	layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL'
	layoutGrow?: 0 | 1
	layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX'
	layoutPositioning?: 'AUTO' | 'ABSOLUTE'
}

export interface FigmaPaint {
	type: string
	visible?: boolean
	opacity?: number
	color?: { r: number; g: number; b: number; a?: number }
	gradientStops?: { color: { r: number; g: number; b: number; a?: number }; position?: number }[]
	gradientHandlePositions?: { x: number; y: number }[]
}

export interface FigmaEffect {
	type: string
	visible?: boolean
	radius?: number
	spread?: number
	offset?: { x: number; y: number }
	color?: { r: number; g: number; b: number; a?: number }
}
