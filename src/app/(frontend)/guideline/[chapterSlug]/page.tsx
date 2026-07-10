import Link from 'next/link'
import { notFound } from 'next/navigation'
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
			<header className="mb-8">
				<h1 className="font-semibold text-3xl">{chapter.title}</h1>
				{chapter.description && (
					<p className="mt-4 text-muted-foreground">{chapter.description}</p>
				)}
			</header>
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
