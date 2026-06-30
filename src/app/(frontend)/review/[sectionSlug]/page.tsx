import { notFound } from 'next/navigation'
import { RuleTables } from '@/features/review/components/rule-tables'
import { getReviewSection } from '@/features/review/navigation'

export default async function ReviewSectionPage({
	params,
}: {
	params: Promise<{ sectionSlug: string }>
}) {
	const { sectionSlug } = await params
	const section = getReviewSection(sectionSlug)

	if (!section) {
		notFound()
	}

	return (
		<div className="w-full px-8 py-8">
			<RuleTables pages={section.pages} />
		</div>
	)
}
