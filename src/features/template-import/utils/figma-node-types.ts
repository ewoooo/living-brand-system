const VECTOR_NODE_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'LINE',
	'ELLIPSE',
	'REGULAR_POLYGON',
])

/** Figma import와 Admin 레이어 편집기가 공유하는 벡터 노드 판별 계약. */
export const isFigmaVectorNodeType = (type: string): boolean => VECTOR_NODE_TYPES.has(type)
