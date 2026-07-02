import { createHash } from 'node:crypto'
import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import {
	downloadFigmaImage,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '../repositories/figma.rest.repository'
import {
	createTemplateAsset,
	findTemplateAssetByChecksum,
} from '../repositories/template-asset.payload.repository'
import {
	collectRenderableNodeIds,
	convertFigmaNodeTree,
	type ImportedAsset,
} from './convert-figma-node-tree'

export interface ConvertFigmaFrameInput {
	fileKey: string
	nodeId: string
}

export interface ConvertFigmaFrameOutput {
	jsonTemplate: JsonTemplate
	/** 렌더 URL을 못 받았거나 다운로드에 실패해 요소에서 빠진 Figma 노드 id */
	skippedImageNodeIds: string[]
}

/**
 * Figma 프레임을 JsonTemplate으로 변환하고 이미지 조각을 template-assets로 영속화하는 Use Case.
 * IMAGE fill은 PNG(hiDPI), 벡터 계열 노드는 SVG로 받아 벡터를 보존한다.
 * 같은 내용의 조각은 checksum으로 재사용하고 새로 만들지 않는다.
 * Template 문서 생성·저장은 하지 않는다 — Admin 폼이 결과를 jsonTemplate 필드에 받아 저장을 결정한다.
 */
export async function convertFigmaFrame(
	user: unknown,
	input: ConvertFigmaFrameInput,
): Promise<ConvertFigmaFrameOutput> {
	const rootNode = await findFigmaNodeTree(input.fileKey, input.nodeId)

	const { imageFillNodeIds, vectorNodeIds } = collectRenderableNodeIds(rootNode)
	// 빈 배열이면 findFigmaImageUrls가 HTTP 호출 없이 빈 맵을 돌려준다.
	const [pngUrls, svgUrls] = await Promise.all([
		findFigmaImageUrls(input.fileKey, imageFillNodeIds, 'png'),
		findFigmaImageUrls(input.fileKey, vectorNodeIds, 'svg'),
	])

	// Figma 이미지 URL은 만료되므로 변환 시점에 내려받아 template-assets(S3)로 영속화한다.
	const assets: Record<string, ImportedAsset> = {}
	const skippedImageNodeIds: string[] = []

	const persistNode = async (nodeId: string, imageUrl: string | undefined, extension: string) => {
		if (!imageUrl) {
			skippedImageNodeIds.push(nodeId)
			return
		}

		try {
			const image = await downloadFigmaImage(imageUrl)
			const checksum = createHash('sha256').update(image.data).digest('hex')
			const asset =
				(await findTemplateAssetByChecksum(user, checksum)) ??
				(await createTemplateAsset(user, {
					data: image.data,
					filename: `figma-${input.fileKey}-${nodeId.replace(/[^a-zA-Z0-9]/g, '-')}.${extension}`,
					mimeType: image.mimeType,
					checksum,
				}))
			assets[nodeId] = { assetId: asset.id, src: asset.url }
		} catch {
			// 조각 하나가 변환 전체를 막지 않게 한다. 빠진 노드는 결과로 보고한다.
			skippedImageNodeIds.push(nodeId)
		}
	}

	for (const nodeId of imageFillNodeIds) {
		await persistNode(nodeId, pngUrls[nodeId], 'png')
	}
	for (const nodeId of vectorNodeIds) {
		await persistNode(nodeId, svgUrls[nodeId], 'svg')
	}

	// 쓰기 계약: 반환 전에 스키마를 강제해 깨진 템플릿이 폼으로 흘러가지 않게 한다.
	const jsonTemplate = jsonTemplateSchema.parse(convertFigmaNodeTree(rootNode, assets))

	return { jsonTemplate, skippedImageNodeIds }
}
