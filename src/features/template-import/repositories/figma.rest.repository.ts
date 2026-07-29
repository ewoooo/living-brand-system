import { env } from '@/env'
import type { FigmaNode } from '@/features/template-import/types'
import { FigmaConfigurationError } from '@/lib/errors'

/**
 * Figma REST API 경계. 임포트 파이프라인의 외부 I/O는 모두 이 파일이 소유한다.
 * 토큰은 서버 환경변수(FIGMA_API_TOKEN)에만 존재하고 응답은 가공 없이 돌려준다.
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1'
const IMAGE_BATCH_SIZE = 100

function getFigmaToken(): string {
	if (!env.FIGMA_API_TOKEN) {
		throw new FigmaConfigurationError()
	}

	return env.FIGMA_API_TOKEN
}

export async function findFigmaNodeTree(fileKey: string, nodeId: string): Promise<FigmaNode> {
	const url = `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`
	const response = await fetch(url, { headers: { 'X-Figma-Token': getFigmaToken() } })

	if (!response.ok) {
		throw new Error(`Figma nodes API failed (${response.status})`)
	}

	const data = (await response.json()) as {
		nodes?: Record<string, { document?: FigmaNode }>
	}
	const rootNode = data.nodes?.[nodeId]?.document

	if (!rootNode) {
		throw new Error(`Figma node "${nodeId}" not found in file "${fileKey}".`)
	}

	return rootNode
}

/**
 * 노드들을 렌더한 임시 URL 맵을 돌려준다. 렌더 실패 노드는 맵에서 빠진다.
 * png는 scale=2(hiDPI), svg는 벡터 보존용으로 벡터 계열 노드에 쓴다.
 */
export async function findFigmaImageUrls(
	fileKey: string,
	nodeIds: string[],
	format: 'png' | 'svg',
): Promise<Record<string, string>> {
	const token = getFigmaToken()
	const imageUrls: Record<string, string> = {}
	const formatQuery =
		format === 'svg' ? 'format=svg&use_absolute_bounds=true' : 'format=png&scale=2'

	for (let i = 0; i < nodeIds.length; i += IMAGE_BATCH_SIZE) {
		const batch = nodeIds.slice(i, i + IMAGE_BATCH_SIZE)
		const url = `${FIGMA_API_BASE}/images/${fileKey}?ids=${encodeURIComponent(batch.join(','))}&${formatQuery}`
		const response = await fetch(url, { headers: { 'X-Figma-Token': token } })

		if (!response.ok) {
			throw new Error(`Figma images API failed (${response.status})`)
		}

		const data = (await response.json()) as { images?: Record<string, string | null> }

		for (const [nodeId, imageUrl] of Object.entries(data.images ?? {})) {
			if (imageUrl) {
				imageUrls[nodeId] = imageUrl
			}
		}
	}

	return imageUrls
}

/** 이미지 조각 하나의 최대 크기 — 폭주한 렌더 결과가 메모리·S3를 잠식하지 않게 막는다. */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

/** Figma가 준 임시 S3 URL에서 이미지 바이트를 내려받는다. URL은 곧 만료되므로 임포트 중에만 쓴다. */
export async function downloadFigmaImage(url: string): Promise<{ data: Buffer; mimeType: string }> {
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Figma image download failed (${response.status})`)
	}

	const data = Buffer.from(await response.arrayBuffer())

	if (data.byteLength > MAX_IMAGE_BYTES) {
		throw new Error(`Figma image exceeds size limit (${data.byteLength} bytes)`)
	}

	return {
		data,
		mimeType: response.headers.get('content-type') || 'image/png',
	}
}
