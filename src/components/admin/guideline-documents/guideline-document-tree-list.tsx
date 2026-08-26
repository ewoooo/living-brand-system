import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { ListViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { listEditableGuidelineDocuments } from '@/features/guideline/services/list-editable-guideline-documents.service'
import { cn } from '@/lib/utils'
import {
	buildGuidelineDocumentTree,
	type GuidelineDocumentTreeNode,
} from './guideline-document-tree'

const depthLabels = ['챕터', '토픽', '페이지']

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
		<ul className={cn('m-0 list-none p-0', depth > 0 && 'ml-5 border-l border-border pl-5')}>
			{nodes.map((node) => (
				<li key={node.id}>
					<div className="flex min-h-[45px] items-center gap-2.5 border-b border-border">
						<Badge variant="outline">{depthLabels[depth] ?? `${depth + 1}단계`}</Badge>
						<Link
							className="mr-auto font-semibold text-foreground"
							href={formatAdminURL({
								adminRoute,
								path: `/collections/${collectionSlug}/${node.id}`,
							})}
						>
							{node.title ?? '(제목 없음)'}
						</Link>
						<Badge variant={node._status === 'published' ? 'highlight' : 'muted'}>
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

export async function GuidelineDocumentTreeList({
	collectionConfig,
	hasCreatePermission,
	locale,
	newDocumentURL,
	payload,
	user,
}: ListViewServerProps) {
	const activeLocale = locale?.code === 'ko' || locale?.code === 'en' ? locale.code : undefined
	const docs = await listEditableGuidelineDocuments(payload, { locale: activeLocale, user })
	const tree = buildGuidelineDocumentTree(docs)

	return (
		<div className="collection-list collection-list--guideline-documents">
			<Gutter className="py-5">
				<header className="mb-5 flex items-center justify-between gap-2.5">
					<div>
						<h1 className="m-0">가이드라인 문서</h1>
						<p className="m-0 text-muted-foreground">
							장·토픽·페이지를 부모 관계와 표시 순서에 따라 보여줍니다.
						</p>
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
					<Empty className="text-muted-foreground">
						<EmptyHeader>
							<EmptyTitle>등록된 문서가 없습니다.</EmptyTitle>
						</EmptyHeader>
					</Empty>
				)}
			</Gutter>
		</div>
	)
}
