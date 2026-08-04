import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import {
	deleteDraftImportedApplicationImage,
	storeDraftImportedApplicationImage,
} from '@/features/application-image/repositories/imported-application-image.payload.repository'
import {
	downloadFigmaImage,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '@/features/template-import/repositories/figma.rest.repository'
import type { FigmaNode } from '@/features/template-import/types'
import {
	convertFigmaNodeToHtml,
	type FigmaHtmlResult,
	type FigmaRenderedAsset,
} from '@/features/template-import/utils/figma-node-to-html'
import type { User } from '@/payload-types'

interface RenderRequest {
	format: 'png' | 'svg'
	nodeId: string
	name: string
}

/**
 * Figma 프레임(fileKey+nodeId)을 inline-style HTML로 변환해 돌려준다. Admin의 Templates 가져오기 필드가 호출한다.
 * 외부 I/O는 Figma/Application Images repository가 소유하고, 이 서비스는 fetch→렌더 판정→저장→변환 순서만 조율한다.
 */
export async function importFigmaHtml(
	source: { fileKey: string; nodeId: string },
	payload: Payload,
	user: User,
): Promise<FigmaHtmlResult & { name: string }> {
	const node = await findFigmaNodeTree(source.fileKey, source.nodeId)
	const renderRequests = collectRenderRequests(node)
	const renderedAssets = renderRequests.length
		? await storeRenderedAssets(source.fileKey, renderRequests, payload, user)
		: {}
	const result = convertFigmaNodeToHtml(node, renderedAssets)

	return { ...result, name: node.name ?? 'Untitled' }
}

const VECTOR_NODE_TYPES = new Set([
	'VECTOR',
	'BOOLEAN_OPERATION',
	'STAR',
	'LINE',
	'ELLIPSE',
	'REGULAR_POLYGON',
])
const KNOWN_HTML_NODE_TYPES = new Set([
	'DOCUMENT',
	'CANVAS',
	'FRAME',
	'GROUP',
	'SECTION',
	'COMPONENT',
	'COMPONENT_SET',
	'INSTANCE',
	'RECTANGLE',
	'TEXT',
	'TRANSFORM_GROUP',
	// SLICE는 이번 범위에서 기존 동작을 유지한다.
	'SLICE',
])
const RASTER_PAINT_TYPES = new Set(['IMAGE', 'PATTERN', 'VIDEO', 'GRADIENT_ANGULAR'])
const CSS_EFFECT_TYPES = new Set(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR'])
const CSS_BLEND_MODES = new Set([
	'NORMAL',
	'PASS_THROUGH',
	'MULTIPLY',
	'SCREEN',
	'OVERLAY',
	'DARKEN',
	'LIGHTEN',
	'COLOR_DODGE',
	'COLOR_BURN',
	'HARD_LIGHT',
	'SOFT_LIGHT',
	'DIFFERENCE',
	'EXCLUSION',
	'HUE',
	'SATURATION',
	'COLOR',
	'LUMINOSITY',
])

function collectRenderRequests(node: FigmaNode): RenderRequest[] {
	if (node.visible === false || node.opacity === 0) return []

	if (requiresRasterFallback(node)) {
		return [{ nodeId: node.id, name: node.name ?? node.id, format: 'png' }]
	}
	if (VECTOR_NODE_TYPES.has(node.type)) {
		return [{ nodeId: node.id, name: node.name ?? node.id, format: 'svg' }]
	}

	return (node.children ?? []).flatMap(collectRenderRequests)
}

function requiresRasterFallback(node: FigmaNode): boolean {
	if (
		node.type === 'TEXT_PATH' ||
		(!KNOWN_HTML_NODE_TYPES.has(node.type) &&
			!VECTOR_NODE_TYPES.has(node.type) &&
			!node.children?.length)
	) {
		return true
	}
	if (node.isMask || node.children?.some((child) => child.isMask)) return true

	const fills = (node.fills ?? []).filter((paint) => paint.visible !== false)
	const strokes = (node.strokes ?? []).filter((paint) => paint.visible !== false)
	if (
		fills.length > 1 ||
		strokes.length > 1 ||
		[...fills, ...strokes].some((paint) => RASTER_PAINT_TYPES.has(paint.type))
	) {
		return true
	}

	if (
		node.effects?.some(
			(effect) => effect.visible !== false && !CSS_EFFECT_TYPES.has(effect.type),
		)
	) {
		return true
	}
	if (node.blendMode && !CSS_BLEND_MODES.has(node.blendMode)) return true

	return !VECTOR_NODE_TYPES.has(node.type) && hasNonAxisAlignedTransform(node)
}

function hasNonAxisAlignedTransform(node: FigmaNode): boolean {
	if (node.rotation) return true
	const transform = node.relativeTransform
	if (!transform) return false

	const [[a, b], [c, d]] = transform
	const epsilon = 0.000001
	return (
		Math.abs(a - 1) > epsilon ||
		Math.abs(b) > epsilon ||
		Math.abs(c) > epsilon ||
		Math.abs(d - 1) > epsilon
	)
}

async function storeRenderedAssets(
	fileKey: string,
	requests: RenderRequest[],
	payload: Payload,
	user: User,
): Promise<Record<string, FigmaRenderedAsset>> {
	const renderedAssets: Record<string, FigmaRenderedAsset> = {}
	const createdAssetIds: number[] = []

	try {
		for (const format of ['svg', 'png'] as const) {
			const formatRequests = requests.filter((request) => request.format === format)
			if (formatRequests.length === 0) continue

			const urls = await findFigmaImageUrls(
				fileKey,
				formatRequests.map((request) => request.nodeId),
				format,
			)

			// 모든 Buffer를 한 번에 잡지 않도록 하나씩 내려받아 바로 upload adapter에 넘긴다.
			for (const request of formatRequests) {
				const url = urls[request.nodeId]
				if (!url) {
					throw new Error(
						`Figma ${format.toUpperCase()} render failed for node "${request.nodeId}".`,
					)
				}

				const { data, mimeType } = await downloadFigmaImage(url)
				const normalizedMimeType = mimeType.split(';', 1)[0]?.trim()
				const expectedMimeType = format === 'svg' ? 'image/svg+xml' : 'image/png'
				if (normalizedMimeType !== expectedMimeType) {
					throw new Error(
						`Figma ${format.toUpperCase()} download returned "${mimeType}" for node "${request.nodeId}".`,
					)
				}

				const checksum = createHash('sha256').update(data).digest('hex')
				const asset = await storeDraftImportedApplicationImage(payload, user, {
					data,
					filename: `figma-${checksum.slice(0, 24)}.${format}`,
					mimeType: normalizedMimeType,
					name: request.name,
				})
				renderedAssets[request.nodeId] = asset
				if (asset.created) createdAssetIds.push(asset.id)
			}
		}

		return renderedAssets
	} catch (error) {
		await Promise.allSettled(
			createdAssetIds.map((id) => deleteDraftImportedApplicationImage(payload, user, id)),
		)
		throw error
	}
}
