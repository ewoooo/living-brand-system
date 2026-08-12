import {
	findImageCarrier,
	isImageColorizeOverlayId,
} from '@/features/template-core/runtime/compose-template-html.client'
import { isFigmaVectorNodeType } from '@/features/template-import/utils/figma-node-types'
import type { TemplateNodeConfig, TemplateNodeConfigMap } from '@/types/template'

export interface LayerRow {
	id: string
	depth: number
	name: string
	figmaType: string
	tag: string
	isText: boolean
	isVector: boolean
	imageAddress?: 'self' | 'parent'
	carrierChildId?: string
	boxWidth?: number
	boxHeight?: number
	text: string
}

const TYPE_LABEL: Record<string, string> = {
	FRAME: '프레임',
	GROUP: '그룹',
	SECTION: '섹션',
	COMPONENT: '컴포넌트',
	COMPONENT_SET: '컴포넌트셋',
	INSTANCE: '인스턴스',
	TEXT: '텍스트',
	RECTANGLE: '사각형',
	ELLIPSE: '타원',
	LINE: '선',
	VECTOR: '벡터',
	STAR: '별',
	POLYGON: '다각형',
	REGULAR_POLYGON: '다각형',
	BOOLEAN_OPERATION: '불리언',
}

export const IMAGE_CONFIG_KEYS = [
	'backgroundImage',
	'generatedImageId',
	'imageTransform',
	'imageColorize',
	'imageInput',
] as const

export const typeLabel = (type: string) => TYPE_LABEL[type] ?? type

export const canAssignImage = (layer: LayerRow) =>
	!layer.isText && !layer.isVector && layer.imageAddress === 'self'

function stylePx(element: Element, property: 'width' | 'height'): number | undefined {
	if (!(element instanceof HTMLElement)) return undefined
	const value = element.style[property]
	if (!value.endsWith('px')) return undefined
	const parsed = Number.parseFloat(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const isCarrierFrameAddress = (node: Element | null, nodeDepth: number): boolean =>
	nodeDepth > 0 &&
	node instanceof HTMLElement &&
	!node.hasAttribute('data-image-carrier') &&
	node.style.overflow === 'hidden' &&
	findImageCarrier(node) !== null

export function parseLayers(html: string): LayerRow[] {
	const rows: LayerRow[] = []
	const doc = new DOMParser().parseFromString(html, 'text/html')

	const walk = (element: Element, depth: number) => {
		if (isImageColorizeOverlayId(element.getAttribute('data-node-id') ?? '')) return
		const tag = element.tagName.toLowerCase()
		const figmaType =
			element.getAttribute('data-figma-type') || (tag === 'p' ? 'TEXT' : 'FRAME')
		const isText = tag === 'p'
		const selfMarked =
			element instanceof HTMLElement && element.hasAttribute('data-image-carrier')
		const frameAddress = isCarrierFrameAddress(element, depth)

		rows.push({
			id: element.getAttribute('data-node-id') || `${depth}-${rows.length}`,
			depth,
			name: element.getAttribute('data-name') || typeLabel(figmaType),
			figmaType,
			tag,
			isText,
			isVector:
				(isFigmaVectorNodeType(figmaType) || figmaType === 'POLYGON') &&
				(tag === 'img' ||
					(element instanceof HTMLElement && Boolean(element.style.maskImage))),
			imageAddress: selfMarked
				? isCarrierFrameAddress(element.parentElement, depth - 1)
					? 'parent'
					: 'self'
				: frameAddress
					? 'self'
					: undefined,
			carrierChildId: frameAddress
				? (findImageCarrier(element)?.getAttribute('data-node-id') ?? undefined)
				: undefined,
			boxWidth: stylePx(element, 'width'),
			boxHeight: stylePx(element, 'height'),
			text: isText ? (element.textContent ?? '') : '',
		})

		for (const child of Array.from(element.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
}

export function pruneCarrierChildImageKeys(
	configs: TemplateNodeConfigMap,
	carrierChildId: string | undefined,
	patch: TemplateNodeConfig,
): TemplateNodeConfigMap {
	if (
		!carrierChildId ||
		!configs[carrierChildId] ||
		!IMAGE_CONFIG_KEYS.some((key) => key in patch)
	) {
		return configs
	}

	const next = { ...configs }
	const child = { ...next[carrierChildId] }
	for (const key of IMAGE_CONFIG_KEYS) delete child[key]
	if (Object.keys(child).length === 0) delete next[carrierChildId]
	else next[carrierChildId] = child
	return next
}
