import { ContentFrame } from '@/components/shared/content-frame'
import { GuidelineChapters } from '../components/guideline-chapters'
import { GuidelineFooter } from '../components/guideline-footer'
import { GuidelineOnboardDisplay } from '../components/guideline-onboard-display'
import type { GetGuidelineNavigationOutput } from '../services/get-guideline-navigation.service'

export function GuidelineOnboard({ navigation }: { navigation: GetGuidelineNavigationOutput }) {
	return (
		<>
			<ContentFrame>
				<div className="flex flex-col gap-3">
					<GuidelineOnboardDisplay title={navigation.title} />
					<GuidelineChapters chapters={navigation.chapters} />
				</div>
			</ContentFrame>
			<GuidelineFooter />
		</>
	)
}
