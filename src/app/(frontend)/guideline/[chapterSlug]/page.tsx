import { ArrowRight } from '@carbon/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
	GuidelineDescriptionFallback,
	GuidelineLabelFallback,
} from '@/features/guideline/components/guideline-content-fallbacks'
import { GuidelineHeader } from '@/features/guideline/components/guideline-header'
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
			<GuidelineHeader title={chapter.title} />
			<GuidelineChapterDescription label={chapter.label} description={chapter.description} />
			<section className="grid grid-cols-2 gap-px border border-border bg-border">
				{chapter.sections.map((section) => (
					<Link
						key={section.id}
						href={`/guideline/${chapterSlug}/${section.slug}`}
						className="flex aspect-square flex-col bg-background p-4 transition-colors hover:bg-muted"
					>
						<h2 className="text-2xl">{section.title}</h2>
						<div className="mt-auto p-2">
							<ArrowRight size={24} />
						</div>
					</Link>
				))}
			</section>
		</>
	)
}

function GuidelineChapterDescription({
	label,
	description,
}: {
	label?: string | null
	description?: string | null
}) {
	return (
		<section className="px-4 py-24 text-balance">
			{label ? (
				<h2 className="mb-12 max-w-2xl text-4xl">{label}</h2>
			) : (
				<GuidelineLabelFallback />
			)}
			{description ? <p>{description}</p> : <GuidelineDescriptionFallback />}
		</section>
	)
}
