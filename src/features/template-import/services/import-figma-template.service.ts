import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'
import {
	downloadFigmaImage,
	findFigmaImageUrls,
	findFigmaNodeTree,
} from '../repositories/figma.rest.repository'
import {
	createDraftTemplate,
	createTemplateAsset,
} from '../repositories/template.payload.repository'
import {
	collectRenderableNodeIds,
	convertFigmaNodeTree,
	type ImportedAsset,
} from './convert-figma-node-tree'

export interface ImportFigmaTemplateInput {
	name: string
	sourceUrl: string
	fileKey: string
	nodeId: string
}

export interface ImportFigmaTemplateOutput {
	templateId: number
	/** 저장된 렌더 계약. 임포트 직후 미리보기에 쓴다. */
	jsonTemplate: JsonTemplate
	/** 렌더 URL을 못 받았거나 다운로드에 실패해 요소에서 빠진 Figma 노드 id */
	skippedImageNodeIds: string[]
}

/**
 * Figma 프레임을 draft Template으로 임포트하는 Use Case.
 * Figma I/O는 figma.rest repository가, 저장은 template.payload repository가 소유하고
 * 이 서비스는 조회 → 에셋 영속화 → 변환 → 검증 → draft 저장 순서만 책임진다.
 */
export async function importFigmaTemplate(
	user: unknown,
	input: ImportFigmaTemplateInput,
): Promise<ImportFigmaTemplateOutput> {
	const rootNode = await findFigmaNodeTree(input.fileKey, input.nodeId)

	const renderableNodeIds = collectRenderableNodeIds(rootNode)
	const imageUrls =
		renderableNodeIds.length > 0
			? await findFigmaImageUrls(input.fileKey, renderableNodeIds)
			: {}

	// Figma 이미지 URL은 만료되므로 임포트 시점에 내려받아 template-assets(S3)로 영속화한다.
	const assets: Record<string, ImportedAsset> = {}
	const skippedImageNodeIds: string[] = []

	for (const nodeId of renderableNodeIds) {
		const imageUrl = imageUrls[nodeId]

		if (!imageUrl) {
			skippedImageNodeIds.push(nodeId)
			continue
		}

		try {
			const image = await downloadFigmaImage(imageUrl)
			const asset = await createTemplateAsset(user, {
				data: image.data,
				filename: `figma-${input.fileKey}-${nodeId.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
				mimeType: image.mimeType,
			})
			assets[nodeId] = { assetId: asset.id, src: asset.url }
		} catch {
			// 조각 하나가 임포트 전체를 막지 않게 한다. 빠진 노드는 결과로 보고한다.
			skippedImageNodeIds.push(nodeId)
		}
	}

	// 쓰기 계약: 저장 전에 스키마를 강제해 깨진 템플릿이 컬렉션에 들어가지 않게 한다.
	const jsonTemplate = jsonTemplateSchema.parse(convertFigmaNodeTree(rootNode, assets))

	const template = await createDraftTemplate(user, {
		name: input.name,
		sourceUrl: input.sourceUrl,
		jsonTemplate,
	})

	return { templateId: template.id, jsonTemplate, skippedImageNodeIds }
}
