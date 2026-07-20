import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import {
	downloadFigmaImage,
	type FigmaNode,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '@/features/template-import/repositories/figma.rest.repository'
import {
	deleteTemplateAsset,
	storeTemplateAsset,
} from '@/features/template-import/repositories/template-asset.payload.repository'
import {
	convertFigmaNodeToHtml,
	type FigmaHtmlResult,
} from '@/features/template-import/utils/figma-node-to-html'
import type { User } from '@/payload-types'

/**
 * Figma 프레임(fileKey+nodeId)을 inline-style HTML로 변환해 돌려준다. Admin의 Templates 가져오기 필드가 호출한다.
 * 외부 I/O는 Figma/Template Asset repository가 소유하고, 이 서비스는 fetch→저장→변환 순서만 조율한다.
 */
export async function importFigmaHtml(
	source: { fileKey: string; nodeId: string },
	payload: Payload,
	user: User,
): Promise<FigmaHtmlResult & { name: string }> {
	const node = await findFigmaNodeTree(source.fileKey, source.nodeId)
	const vectorNodeIds = collectVectorNodeIds(node)
	const vectorAssetUrls = vectorNodeIds.length
		? await storeVectorAssets(source.fileKey, vectorNodeIds, payload, user)
		: {}
	const result = convertFigmaNodeToHtml(node, vectorAssetUrls)

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

function collectVectorNodeIds(node: FigmaNode): string[] {
	if (node.visible === false || node.opacity === 0) return []
	if (VECTOR_NODE_TYPES.has(node.type)) return [node.id]
	return (node.children ?? []).flatMap(collectVectorNodeIds)
}

async function storeVectorAssets(
	fileKey: string,
	nodeIds: string[],
	payload: Payload,
	user: User,
): Promise<Record<string, string>> {
	const urls = await findFigmaImageUrls(fileKey, nodeIds, 'svg')
	const assetUrls: Record<string, string> = {}
	const createdAssetIds: number[] = []

	try {
		// 한 번에 모든 SVG Buffer를 잡지 않도록 하나씩 내려받아 바로 upload adapter에 넘긴다.
		for (const nodeId of nodeIds) {
			const url = urls[nodeId]
			if (!url) throw new Error(`Figma SVG render failed for node "${nodeId}".`)

			const { data, mimeType } = await downloadFigmaImage(url)
			const normalizedMimeType = mimeType.split(';', 1)[0]?.trim()
			if (normalizedMimeType !== 'image/svg+xml') {
				throw new Error(`Figma SVG download returned "${mimeType}" for node "${nodeId}".`)
			}

			const checksum = createHash('sha256').update(data).digest('hex')
			const asset = await storeTemplateAsset(payload, user, {
				checksum,
				data,
				filename: `figma-${safeFilenamePart(nodeId)}-${checksum.slice(0, 12)}.svg`,
				mimeType: normalizedMimeType,
			})
			assetUrls[nodeId] = asset.url
			if (asset.created) createdAssetIds.push(asset.id)
		}

		return assetUrls
	} catch (error) {
		await Promise.allSettled(
			createdAssetIds.map((id) => deleteTemplateAsset(payload, user, id)),
		)
		throw error
	}
}

function safeFilenamePart(nodeId: string): string {
	return nodeId.replace(/[^a-zA-Z0-9_-]/g, '-')
}
