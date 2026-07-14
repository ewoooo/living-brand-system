import { findFigmaNodeTree } from '@/features/template-import/repositories/figma.rest.repository'
import {
	type FigmaHtmlResult,
	figmaNodeToHtml,
} from '@/features/template-import/utils/figma-node-to-html'

/**
 * Figma 프레임(fileKey+nodeId)을 inline-style HTML로 변환해 돌려준다. Admin의 Templates 가져오기 필드가 호출한다.
 * 외부 I/O(Figma REST GET)는 figma.rest.repository가 소유하고, 이 서비스는 fetch→변환 조율만 한다. DB·에셋은 건드리지 않는다.
 */
export async function importFigmaHtml(source: {
	fileKey: string
	nodeId: string
}): Promise<FigmaHtmlResult & { name: string }> {
	const node = await findFigmaNodeTree(source.fileKey, source.nodeId)
	const result = figmaNodeToHtml(node)

	return { ...result, name: node.name ?? 'Untitled' }
}
