import { isTemplateVectorNodeType } from '@/features/template-core/domain/template-node-types'
import {
	findImageCarrier,
	isImageColorizeOverlayId,
} from '@/features/template-core/runtime/compose-template-html.client'
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

/**
 * 목록을 켜고 끈다. 보이는 옵션을 전부 켠 상태가 되면 목록 자체를 지워 "전부 허용"으로
 * 되돌린다. 저장값에 현재 보이지 않는 id(미발행 등)가 섞여 있을 수 있으므로, 그 값들은
 * 건드리지 않고 그대로 next에 남기되 collapse 판단(`all`과 길이 비교)에서는 `all`에 없는
 * id를 세지 않는다 — 안 그러면 보이지 않는 id가 "이미 켜진 것"으로 잘못 세어져 하나만
 * 꺼도 "전부 허용"으로 조용히 넓어진다.
 */
export function toggleAllowedId<T>(
	current: readonly T[] | undefined,
	all: readonly T[],
	id: T,
): T[] | undefined {
	const base = current ?? all
	const next = base.includes(id) ? base.filter((value) => value !== id) : [...base, id]
	const visibleCount = next.filter((value) => all.includes(value)).length
	return visibleCount === all.length ? undefined : next
}

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
				(isTemplateVectorNodeType(figmaType) || figmaType === 'POLYGON') &&
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
