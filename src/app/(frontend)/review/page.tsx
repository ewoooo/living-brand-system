import { CheckSections } from '@/features/asset-check/components/rule-tables'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'

export default async function ReviewPage() {
	return <CheckSections sections={await getCheckRuleset()} />
}
