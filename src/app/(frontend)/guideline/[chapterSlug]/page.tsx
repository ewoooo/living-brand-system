import { ArrowRight } from '@carbon/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuidelineHeader } from '@/features/guideline/components/guideline-header'
import { getGuidelineChapter } from '@/features/guideline/services/get-guideline-chapter.service'

const DESCRIPTION_PLACEHOLDER =
	"Build Bonds This is the guiding ethos behind IBM's design philosophy and principles. This helps us distinguish every element and every experience Designed by IBM."

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
						<ArrowRight className="mt-auto self-end" size={24} />
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
			<h2 className="mb-12 max-w-2xl text-4xl">{label || DESCRIPTION_PLACEHOLDER}</h2>
			{description && <p>{description}</p>}
		</section>
	)
}
