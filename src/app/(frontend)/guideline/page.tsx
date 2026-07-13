import { GuidelineOnboard } from '@/features/guideline/components/pages/guideline-onboard'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineIndexPage() {
	const navigation = await getGuidelineNavigation()

	return <GuidelineOnboard navigation={navigation} />
}
