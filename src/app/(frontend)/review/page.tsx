import { redirect } from 'next/navigation'
import { getReviewNavigation } from '@/features/review/navigation'

export default function ReviewIndexPage() {
	const { chapters } = getReviewNavigation()
	const firstSection = chapters[0]?.sections[0]

	redirect(firstSection ? firstSection.href : '/')
}
