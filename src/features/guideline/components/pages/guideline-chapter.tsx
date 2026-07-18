import type { GetGuidelineChapterOutput } from '../../services/get-guideline-chapter.service'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import {
	GuidelineDescriptionFallback,
	GuidelineLabelFallback,
} from '../guideline-content-fallbacks'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'
import { RefreshRouteOnSave } from '../refresh-route-on-save'

const variant = 'chapter' satisfies GuidelineVariant

export function GuidelineChapter({
	chapter,
	chapterSlug,
	isPreview,
}: {
	chapter: GetGuidelineChapterOutput
	chapterSlug: string
	isPreview: boolean
}) {
	return (
		<>
			{isPreview && <RefreshRouteOnSave />}
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
				<h2 className="mb-12 max-w-2xl font-body font-normal text-2xl">{label}</h2>
			) : (
				<GuidelineLabelFallback />
			)}
			{description ? (
				<p className="font-body font-normal text-base">{description}</p>
			) : (
				<GuidelineDescriptionFallback variant={variant} />
			)}
		</section>
	)
}
