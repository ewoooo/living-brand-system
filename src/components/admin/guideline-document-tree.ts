import type { GuidelineDocument } from '@/payload-types'

type TreeDocument = Pick<GuidelineDocument, '_status' | 'displayOrder' | 'id' | 'parent' | 'title'>

export type GuidelineDocumentTreeNode = TreeDocument & {
	children: GuidelineDocumentTreeNode[]
}

const parentId = (parent: TreeDocument['parent']) =>
	typeof parent === 'object' && parent !== null ? parent.id : parent

const documentTypeLabels = ['챕터', '섹션', '페이지']

export function guidelineBreadcrumbCount(value: unknown, initialValue: unknown, rowCount: number) {
	if (Array.isArray(value)) return value.length
	if (Array.isArray(initialValue)) return initialValue.length
	return rowCount
}

export function guidelineDocumentTypeLabel(
	breadcrumbCount: number,
	hasParent: boolean,
	parentModified: boolean,
) {
	if (!hasParent) return '챕터'
	if (parentModified || breadcrumbCount === 0) return '저장 후 결정'
	return documentTypeLabels[breadcrumbCount - 1] ?? `${breadcrumbCount}단계 문서`
}

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
