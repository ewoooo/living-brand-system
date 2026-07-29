import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import type { GetGuidelineNavigationOutput } from '../../services/get-guideline-navigation.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'

export function GuidelineOnboard({ navigation }: { navigation: GetGuidelineNavigationOutput }) {
	const { title, chapters } = navigation
	const variant = 'onboard' satisfies GuidelineVariant
	const DESCRIPTION =
		'가이드라인은 브랜드 기준을 구축하기 위한 운영 문서입니다. 이를 사용해 브랜드 원칙을 이해하고, 제작 기준을 계획하고 적용하고, 결과물을 검수하고, 이미 사용 중인 도구와 함께 일관된 산출물을 만들 수 있습니다.'

	return (
		<GuidelineContentFrame>
			{/*Onboard Header*/}
			<section className="mb-32 flex flex-col gap-20">
				<GuidelineHeader variant="onboard" title={title} />
				<GuidelineDescription variant={variant} description={DESCRIPTION} />
			</section>

			{/*Section Link Grids*/}
			<section className="mb-8">
				<GuidelineNavigationGrid items={chapters} variant="prominent" />
			</section>
		</GuidelineContentFrame>
	)
}
