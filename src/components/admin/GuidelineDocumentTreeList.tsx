import { Button, Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { ListViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import {
	buildGuidelineDocumentTree,
	type GuidelineDocumentTreeNode,
} from './guideline-document-tree'

const depthLabels = ['챕터', '섹션', '페이지']

function TreeItems({
	adminRoute,
	collectionSlug,
	depth = 0,
	nodes,
}: {
	adminRoute: string
	collectionSlug: string
	depth?: number
	nodes: GuidelineDocumentTreeNode[]
}) {
	return (
		<ul className="guideline-document-tree__items">
			{nodes.map((node) => (
				<li key={node.id}>
					<div className="guideline-document-tree__row">
						<span className="guideline-document-tree__depth">
							{depthLabels[depth] ?? `${depth + 1}단계`}
						</span>
						<Link
							className="guideline-document-tree__title"
							href={formatAdminURL({
								adminRoute,
								path: `/collections/${collectionSlug}/${node.id}`,
							})}
						>
							{node.title}
						</Link>
						<span>{node._status === 'published' ? '발행됨' : '초안'}</span>
						<span>순서 {node.displayOrder}</span>
					</div>
					{node.children.length > 0 && (
						<TreeItems
							adminRoute={adminRoute}
							collectionSlug={collectionSlug}
							depth={depth + 1}
							nodes={node.children}
						/>
					)}
				</li>
			))}
		</ul>
	)
}

export default async function GuidelineDocumentTreeList({
	collectionConfig,
	hasCreatePermission,
	locale,
	newDocumentURL,
	payload,
	user,
}: ListViewServerProps) {
	const activeLocale = locale?.code === 'ko' || locale?.code === 'en' ? locale.code : undefined
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		limit: 0,
		locale: activeLocale,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
	})
	const tree = buildGuidelineDocumentTree(docs)

	return (
		<div className="collection-list collection-list--guideline-documents">
			<Gutter className="guideline-document-tree">
				<header className="guideline-document-tree__header">
					<div>
						<h1>가이드라인 문서</h1>
						<p>장·섹션·페이지를 부모 관계와 표시 순서에 따라 보여줍니다.</p>
					</div>
					{hasCreatePermission && (
						<Button el="link" to={newDocumentURL}>
							새 문서
						</Button>
					)}
				</header>

				{tree.length > 0 ? (
					<nav aria-label="가이드라인 문서 계층">
						<TreeItems
							adminRoute={payload.config.routes.admin}
							collectionSlug={collectionConfig.slug}
							nodes={tree}
						/>
					</nav>
				) : (
					<p className="guideline-document-tree__empty">등록된 문서가 없습니다.</p>
				)}
			</Gutter>
		</div>
	)
}
