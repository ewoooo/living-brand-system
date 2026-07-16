import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { ListViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
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
						<Badge variant="outline">{depthLabels[depth] ?? `${depth + 1}단계`}</Badge>
						<Link
							className="guideline-document-tree__title"
							href={formatAdminURL({
								adminRoute,
								path: `/collections/${collectionSlug}/${node.id}`,
							})}
						>
							{node.title}
						</Link>
						<Badge variant={node._status === 'published' ? 'default' : 'secondary'}>
							{node._status === 'published' ? '발행됨' : '초안'}
						</Badge>
						<Badge variant="outline">순서 {node.displayOrder}</Badge>
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
						<Button asChild>
							<Link href={newDocumentURL}>새 문서</Link>
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
					<Empty className="guideline-document-tree__empty">
						<EmptyHeader>
							<EmptyTitle>등록된 문서가 없습니다.</EmptyTitle>
						</EmptyHeader>
					</Empty>
				)}
			</Gutter>
		</div>
	)
}
