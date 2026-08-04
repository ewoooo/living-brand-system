import type { FigmaRenderedAsset, FigmaSourceNode, IrNode } from './figma-ir'
import {
	createBoxStyle,
	createChildPlacementStyle,
	createContainerStyle,
	createTextStyle,
	resolveBackgroundValue,
	roundCssNumber,
} from './lower-figma-visuals'

/**
 * 정규화(normalize): Figma 소스 트리 → IR 트리.
 *
 * 파이프라인에서 "판단"을 소유하는 단계다 — 태그 선택(div/p/img), 비가시 노드 제거,
 * 스타일 병합 순서, 렌더 에셋 치환을 여기서 전부 끝낸다. emit은 결과 IR을 문자열화만 한다.
 */

/** 루트 진입점: 소스 트리를 IR 트리로 정규화한다. 루트가 비가시면 null. */
export function normalizeFigmaNode(
	node: FigmaSourceNode,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>> = {},
): IrNode | null {
	return normalizeNode(node, null, true, renderedAssets)
}

/**
 * 노드 하나를 IrNode로 옮긴다. 스타일 병합 순서가 곧 우선순위다:
 * 컨테이너 레이아웃 → 박스 속성 → 텍스트/배경 → 자식 배치(마지막이 이긴다 — 절대배치 자식의
 * position:absolute가 컨테이너 기본 position:relative를 덮어쓰는 것이 의도).
 * 렌더 에셋이 있는 노드는 img 하나로 치환되고 자식은 그리지 않는다(에셋 픽셀에 이미 포함).
 */
function normalizeNode(
	node: FigmaSourceNode,
	parent: FigmaSourceNode | null,
	isRoot: boolean,
	renderedAssets: Readonly<Record<string, FigmaRenderedAsset>>,
): IrNode | null {
	if (node.visible === false) return null

	const isText = node.type === 'TEXT'
	const renderedAsset = renderedAssets[node.id]
	const renderedBounds =
		renderedAsset && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}

	const style: IrNode['style'] = {
		'box-sizing': 'border-box',
		...(isRoot && node.absoluteBoundingBox
			? {
					width: `${roundCssNumber(node.absoluteBoundingBox.width)}px`,
					height: `${roundCssNumber(node.absoluteBoundingBox.height)}px`,
				}
			: {}),
		...(renderedAsset ? { display: 'block', ...renderedBounds } : createContainerStyle(node)),
		...(renderedAsset ? {} : createBoxStyle(node)),
		// 컨테이너는 position:relative를 기본으로 둬 절대배치 자식의 기준 박스가 된다.
		// createChildPlacementStyle이 뒤에 병합되므로, 이 노드 자신이 절대배치면 position:absolute가 이겨 덮어쓴다.
		...(renderedAsset
			? {}
			: isText
				? createTextStyle(node)
				: { position: 'relative', background: resolveBackgroundValue(node) }),
		...createChildPlacementStyle(node, parent, Boolean(renderedAsset)),
	}

	const children = renderedAsset
		? []
		: (node.children ?? [])
				.map((child) => normalizeNode(child, node, false, renderedAssets))
				.filter((child): child is IrNode => child !== null)

	return {
		id: node.id,
		name: node.name ?? '',
		figmaType: node.type,
		tag: renderedAsset ? 'img' : isText ? 'p' : 'div',
		style,
		text: !renderedAsset && isText ? (node.characters ?? '') : undefined,
		asset: renderedAsset,
		children,
	}
}
