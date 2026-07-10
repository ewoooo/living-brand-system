/**
 * [throwaway] Figma import dry-run — 변환 품질 눈으로 확인용. S3/DB 안 건드림(Figma GET만).
 * 실행: source ~/.nvm/nvm.sh && nvm use 22 && pnpm exec payload run scripts/_inspect-figma-import.ts
 */
import {
	type FigmaNode,
	findFigmaNodeTree,
} from '@/features/template-import/repositories/figma.rest.repository'
import {
	collectRenderableNodeIds,
	convertFigmaNodeTree,
} from '@/features/template-import/utils/convert-figma-node-tree'

const fileKey = 'Wl9p2kQENUqapg6iOVHVOF'
const nodeId = '161:5'

const root = await findFigmaNodeTree(fileKey, nodeId)

console.log('=== RAW TREE (ground truth) ===')
const walk = (n: FigmaNode, depth = 0) => {
	const b = n.absoluteBoundingBox
	const box = b
		? `(${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)})`
		: '(no box)'
	const txt = n.characters ? ` "${n.characters.slice(0, 24)}"` : ''
	const auto = n.layoutMode ? ` auto=${n.layoutMode}` : ''
	console.log(`${'  '.repeat(depth)}- ${n.type} [${n.name ?? ''}] ${box}${txt}${auto}`)
	for (const c of n.children ?? []) walk(c, depth + 1)
}
walk(root)

const { imageFillNodeIds, vectorNodeIds } = collectRenderableNodeIds(root)
console.log('\n=== RENDERABLE (asset 필요 노드) ===')
console.log('imageFill(png):', imageFillNodeIds)
console.log('vector(svg):', vectorNodeIds)

const tpl = convertFigmaNodeTree(root, {})
console.log('\n=== JsonTemplate (dry, empty assets) ===')
console.log(`canvas ${tpl.width}x${tpl.height}  bg=${tpl.background}  hasGrid=${'grid' in tpl}`)
console.log(`elements: ${tpl.elements.length}`)
for (const el of tpl.elements) {
	const t = el.type === 'text' ? ` "${(el as { text?: string }).text?.slice(0, 28)}"` : ''
	console.log(
		`  · ${el.type} id=${el.id} (${el.x},${el.y} ${el.width}x${el.height}) z=${el.zIndex} locked=${el.locked} slot="${el.slotLabel ?? ''}"${t}`,
	)
}
