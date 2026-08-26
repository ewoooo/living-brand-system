import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { ListViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { listEditableGuidelineDocuments } from '@/features/guideline/services/list-editable-guideline-documents.service'
import {
	type GuidelineChapterGroup,
	groupGuidelineTopicsByChapter,
} from './guideline-document-tree'

// 🔴 재귀 트리가 아니라 챕터별 한 겹 그룹이다(2026-08-26). 문서 자기참조가 사라졌다.
function ChapterGroup({
	adminRoute,
	collectionSlug,
	group,
}: {
	adminRoute: string
	collectionSlug: string
	group: GuidelineChapterGroup
}) {
	return (
		<section className="mb-6">
			<h2 className="m-0 mb-1 flex items-center gap-2.5 font-semibold text-base">
				{group.title}
				<Badge variant={group.id === null ? 'muted' : 'outline'}>
					토픽 {group.topics.length}
				</Badge>
			</h2>
			<ul className="m-0 list-none p-0">
				{group.topics.map((topic) => (
					<li key={topic.id}>
						<div className="flex min-h-[45px] items-center gap-2.5 border-border border-b">
							<Link
								className="mr-auto font-semibold text-foreground"
								href={formatAdminURL({
									adminRoute,
									path: `/collections/${collectionSlug}/${topic.id}`,
								})}
							>
								{topic.title ?? '(제목 없음)'}
							</Link>
							<Badge variant={topic._status === 'published' ? 'highlight' : 'muted'}>
								{topic._status === 'published' ? '발행됨' : '초안'}
							</Badge>
							<Badge variant="outline">순서 {topic.displayOrder}</Badge>
						</div>
					</li>
				))}
			</ul>
		</section>
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
	const { topics, chapters } = await listEditableGuidelineDocuments(payload, {
		locale: activeLocale,
		user,
	})
	const groups = groupGuidelineTopicsByChapter(topics, chapters)

	return (
		<div className="collection-list collection-list--guideline-documents">
			<Gutter className="py-5">
				<header className="mb-5 flex items-center justify-between gap-2.5">
					<div>
						<h1 className="m-0">가이드라인 토픽</h1>
						<p className="m-0 text-muted-foreground">
							챕터별로 묶어 표시 순서대로 보여줍니다.
						</p>
					</div>
					{hasCreatePermission && (
						<Button asChild>
							<Link href={newDocumentURL}>새 문서</Link>
						</Button>
					)}
				</header>

				{groups.some((group) => group.topics.length > 0) ? (
					<nav aria-label="챕터별 가이드라인 토픽">
						{groups.map((group) => (
							<ChapterGroup
								adminRoute={payload.config.routes.admin}
								collectionSlug={collectionConfig.slug}
								group={group}
								key={group.id ?? 'orphan'}
							/>
						))}
					</nav>
				) : (
					<Empty className="text-muted-foreground">
						<EmptyHeader>
							<EmptyTitle>등록된 토픽이 없습니다.</EmptyTitle>
						</EmptyHeader>
					</Empty>
				)}
			</Gutter>
		</div>
	)
}
