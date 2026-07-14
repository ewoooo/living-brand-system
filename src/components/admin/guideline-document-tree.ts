import type { GuidelineDocument } from '@/payload-types'

type TreeDocument = Pick<GuidelineDocument, '_status' | 'displayOrder' | 'id' | 'parent' | 'title'>

export type GuidelineDocumentTreeNode = TreeDocument & {
	children: GuidelineDocumentTreeNode[]
}

const parentId = (parent: TreeDocument['parent']) =>
	typeof parent === 'object' && parent !== null ? parent.id : parent

export function buildGuidelineDocumentTree(documents: TreeDocument[]): GuidelineDocumentTreeNode[] {
	const sorted = [...documents].sort(
		(a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title, 'ko'),
	)
	const nodes = new Map<number, GuidelineDocumentTreeNode>(
		sorted.map((document) => [document.id, { ...document, children: [] }]),
	)
	const roots: GuidelineDocumentTreeNode[] = []

	for (const document of sorted) {
		const node = nodes.get(document.id)
		if (!node) continue
		const id = parentId(document.parent)
		const parent = id == null ? undefined : nodes.get(id)
		if (parent) parent.children.push(node)
		else roots.push(node)
	}

	return roots
}
