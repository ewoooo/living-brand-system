import type { IrNode } from './figma-ir'

/**
 * 방출(emit): IR 트리 → inline-style HTML 문자열.
 *
 * 판단 없음 — 태그/스타일/자식은 normalize가 이미 확정했고, 여기서는 이스케이프와
 * pretty-print 규칙만 적용해 기계적으로 문자열화한다.
 * 런타임(DB 저장 HTML)에서 그대로 떠야 하므로 Tailwind가 아니라 inline style로 굳힌다.
 */

/** 텍스트 노드 내용의 HTML 특수문자 이스케이프. */
const escapeHtmlText = (t: string) =>
	t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 속성값 이스케이프 — " 가 속성을 끊고 핸들러를 주입하는 것을 막는다. */
const escapeHtmlAttribute = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/**
 * IrNode 하나(와 그 서브트리)를 HTML 문자열로 방출한다.
 *
 * 개발자 확인용 pretty-print: 속성 한 줄씩, style은 선언 한 줄씩 펼친다.
 * HTML 속성값은 개행/탭을 담을 수 있고 CSS는 선언 사이 공백을 무시하므로 렌더에 영향 없다.
 * 모든 속성/선언 값은 escapeHtmlAttribute로 감싼다 — style의 " (font-family:"Inter")나 id/name의 " 가 속성을 끊고 핸들러를 주입하는 걸 막는다.
 * ponytail: escapeHtmlAttribute는 속성 탈출만 막고 CSS 값 내부(Figma 원본 문자열)의 ';' 주입은 못 막는다 → 렌더 경계 DOMPurify가 후속 과제.
 */
export function emitTemplateHtml(node: IrNode, depth = 0): string {
	const pad = '\t'.repeat(depth)
	const attrPad = `${pad}\t`
	const declPad = `${pad}\t\t`

	const attrLines = [
		`data-node-id="${escapeHtmlAttribute(node.id)}"`,
		`data-figma-type="${escapeHtmlAttribute(node.figmaType)}"`,
		`data-name="${escapeHtmlAttribute(node.name)}"`,
		...(node.asset
			? [
					`data-asset-collection="${node.asset.collection}"`,
					`data-asset-id="${node.asset.id}"`,
					`src="${escapeHtmlAttribute(node.asset.url)}"`,
					'alt=""',
				]
			: []),
		// background-image로 낮춘 IMAGE fill의 에셋 참조 — div의 단일 style url과 짝을 이뤄 발행 승격 대상이 된다.
		...(node.fillAsset && !node.asset
			? [
					`data-asset-collection="${node.fillAsset.collection}"`,
					`data-asset-id="${node.fillAsset.id}"`,
				]
			: []),
	]
		.map((a) => `${attrPad}${a}`)
		.join('\n')

	const declLines = Object.entries(node.style)
		.filter(([, v]) => v != null && v !== '')
		.map(([k, v]) => `${declPad}${escapeHtmlAttribute(`${k}:${v}`)};`)
		.join('\n')

	const open = `${pad}<${node.tag}\n${attrLines}\n${attrPad}style="\n${declLines}\n${attrPad}"\n${pad}>`
	// img(렌더 에셋)는 void 태그 — 닫는 태그 없이 끝난다.
	if (node.tag === 'img') return open

	// 텍스트는 내용을 여는 태그와 같은 줄에 둔다(공백/개행 보존이 white-space에 걸리므로 재들여쓰기 금지).
	if (node.tag === 'p') return `${open}${escapeHtmlText(node.text ?? '')}</${node.tag}>`

	// 요소 사이 공백은 grid/flex 아이템이 되지 않고 block에선 collapse되어 렌더에 영향 없다.
	const children = node.children.map((child) => emitTemplateHtml(child, depth + 1))
	if (!children.length) return `${open}</${node.tag}>`
	return `${open}\n${children.join('\n')}\n${pad}</${node.tag}>`
}
