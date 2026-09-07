import type {
	DefaultNodeTypes,
	SerializedTableCellNode,
	SerializedTableNode,
	SerializedTableRowNode,
} from '@payloadcms/richtext-lexical'
import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { Fragment } from 'react'

const isRow = (node: SerializedLexicalNode): node is SerializedTableRowNode =>
	node.type === 'tablerow'
const isCell = (node: SerializedLexicalNode): node is SerializedTableCellNode =>
	node.type === 'tablecell'

/**
 * 가이드라인 richText의 JSX 컨버터. 기본 컨버터 위에 **표 → 스펙 리스트** 하나만 덮어쓴다(Figma 135:488).
 *
 * 저작자가 에디터에서 2열 표를 그리면 첫 열은 라벨(굵게), 둘째 열은 값(muted)인 `<dl>`로 그린다 —
 * 표 데이터는 그대로 두고 표현만 바꾼다. "첫 열이 라벨"은 richText 표가 갖지 않는 뜻이라 우리 렌더 관례다.
 * 🔴 열이 2개가 아닌 표는 이 관례가 성립하지 않으므로 Payload 기본 표로 폴백한다.
 */
export const guidelineRichTextConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
	defaultConverters,
}) => ({
	...defaultConverters,
	table: (args) => {
		// 컨버터 맵의 노드 타입이 느슨해(any) 여기서 한 번 좁힌다.
		const node = args.node as SerializedTableNode
		const rows: SerializedTableRowNode[] = (node.children ?? []).filter(isRow)
		const cells: SerializedTableCellNode[][] = rows.map((row) =>
			(row.children ?? []).filter(isCell),
		)
		const isSpecList = rows.length > 0 && cells.every((row) => row.length === 2)
		if (!isSpecList) {
			return typeof defaultConverters.table === 'function'
				? defaultConverters.table(args)
				: null
		}
		return (
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
				{cells.map(([label, value], index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: 표 행은 id가 없고 순서가 곧 정체성이다.
					<Fragment key={index}>
						<dt className="font-semibold">
							{args.nodesToJSX({ nodes: label.children ?? [], parent: label })}
						</dt>
						<dd className="text-muted-foreground">
							{args.nodesToJSX({ nodes: value.children ?? [], parent: value })}
						</dd>
					</Fragment>
				))}
			</dl>
		)
	},
})
