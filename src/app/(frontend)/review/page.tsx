import { ReviewSections } from '@/features/review/components/rule-tables'
import { getReviewContent } from '@/features/review/navigation'

export default function ReviewPage() {
	return <ReviewSections chapters={getReviewContent()} />
}
