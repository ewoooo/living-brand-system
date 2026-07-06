import { ReviewSections } from '@/features/review/components/rule-tables'
import { getReviewRuleset } from '@/features/review/services/get-review-ruleset.service'

export default async function ReviewPage() {
	return <ReviewSections sections={await getReviewRuleset()} />
}
