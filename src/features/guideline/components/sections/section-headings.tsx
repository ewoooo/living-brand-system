import { ContentFrame } from '@/components/shared/content-frame'
import type { SectionBlock } from '@/payload-types'
import { GuidelineDescription } from '../typography/guideline-description'
import { GuidelineHeader } from '../typography/guideline-header'

export function SectionHeadings({
	title,
	description,
}: {
	title?: string | null
	description?: SectionBlock['description']
}) {
	if (!title && !description) return null
	return (
		<ContentFrame variant="heading" className="mx-auto max-w-[1540px]">
			<div data-slot="section-headings" className="flex flex-col gap-8">
				<GuidelineHeader variant="section" title={title} />
				<GuidelineDescription description={description} className="max-w-[767px]" />
			</div>
		</ContentFrame>
	)
}
