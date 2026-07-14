import type { GetGuidelineChapterOutput } from '../../services/get-guideline-chapter.service'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import {
	GuidelineDescriptionFallback,
	GuidelineLabelFallback,
} from '../guideline-content-fallbacks'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'

const variant = 'chapter' satisfies GuidelineVariant

export function GuidelineChapter({
	chapter,
	chapterSlug,
}: {
	chapter: GetGuidelineChapterOutput
	chapterSlug: string
}) {
	return (
		<>
			<GuidelineHeader variant={variant} title={chapter.title} />
			<GuidelineChapterDescription label={chapter.label} description={chapter.description} />
			<GuidelineNavigationGrid
				items={chapter.sections.map((section) => ({
					id: section.id,
					title: section.title,
					href: `/guideline/${chapterSlug}/${section.slug}`,
				}))}
			/>
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
			{description ? (
				<p>{description}</p>
			) : (
				<GuidelineDescriptionFallback variant={variant} />
			)}
		</section>
	)
}
