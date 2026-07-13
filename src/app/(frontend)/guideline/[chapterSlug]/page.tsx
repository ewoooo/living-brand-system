import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuidelineChapterHeader } from '@/components/guideline/guideline-chapter-header'
import { GuidelineHeaderImage } from '@/components/guideline/guideline-header-image'
import { getGuidelineChapter } from '@/features/guideline/services/get-guideline-chapter.service'

export default async function GuidelineChapterPage({
	params,
}: {
	params: Promise<{ chapterSlug: string }>
}) {
	const { chapterSlug } = await params
	const chapter = await getGuidelineChapter(chapterSlug)

	if (!chapter) {
		notFound()
	}

	return (
		<>
			<GuidelineChapterHeader
				title={chapter.title}
				label={chapter.label || undefined}
				description={chapter.description || ''}
			/>
			<GuidelineHeaderImage className="mb-4" />
			<section className="grid gap-4 xl:grid-cols-2">
				{chapter.sections.map((section) => (
					<Link
						key={section.id}
						href={`/guideline/${chapterSlug}/${section.slug}`}
						className="rounded-md border border-neutral-200 p-4 transition-colors hover:bg-neutral-500/5 dark:border-neutral-800"
					>
						<h2 className="font-semibold text-lg">{section.title}</h2>
						{section.description && (
							<p className="mt-3 text-muted-foreground text-sm leading-6">
								{section.description}
							</p>
						)}
					</Link>
				))}
			</section>
		</>
	)
}
