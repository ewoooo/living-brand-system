import { ContentFrame } from '@/components/shared/content-frame'
import type { GetGuidelineChapterOutput } from '../../services/get-guideline-chapter.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'
import { RefreshRouteOnSave } from '../refresh-route-on-save'
import { getTopicIcon } from '../topic-icon'

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
		<ContentFrame>
			{isPreview && <RefreshRouteOnSave />}
			<GuidelineHeader variant={variant} title={chapter.title} />
			<GuidelineDescription variant={variant} description={chapter.description} />
			<GuidelineNavigationGrid
				variant="default"
				items={chapter.topics.map((topic) => ({
					id: topic.id,
					title: topic.title,
					description: topic.description,
					href: `/guideline/${chapterSlug}/${topic.slug}`,
					icon: getTopicIcon(topic.slug),
				}))}
			/>
		</ContentFrame>
	)
}
