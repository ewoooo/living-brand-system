import type { GetGuidelineNavigationOutput } from '../../services/get-guideline-navigation.service'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import {
	GuidelineDescriptionFallback,
	GuidelineLabelFallback,
} from '../guideline-content-fallbacks'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'

export function GuidelineOnboard({ navigation }: { navigation: GetGuidelineNavigationOutput }) {
	const { title, chapters } = navigation
	const variant = 'onboard' satisfies GuidelineVariant

	return (
		<>
			<header className="mb-8">
				<GuidelineHeader as="h1" variant="onboard" title={title} />
				<GuidelineChapterDescription
					label={
						'가이드라인은 브랜드 기준을 구축하기 위한 운영 문서입니다. 이를 사용해 브랜드 원칙을 이해하고, 제작 기준을 계획하고 적용하고, 결과물을 검수하고, 이미 사용 중인 도구와 함께 일관된 산출물을 만들 수 있습니다.'
					}
					description={
						'The identity guidelines serve as the definitive source of truth—a rubric by which we gauge the success of everything we make (from furniture to campaign ads to retail catalogs), everywhere we show up (from brick-and-mortar showrooms to digital experiences to exhibition wall copy). Each component of the visual language is outlined individually, as well as how the full system works together. In the end, guidelines are just that—a guide. Always use your best judgment when creating materials and use this as a starting point.'
					}
					variant={variant}
				/>
				<div className="mb-4 max-w-2xl text-balance text-foreground-muted">
					<p></p>
				</div>
			</header>
			<section className="mb-8">
				<GuidelineNavigationGrid items={chapters} headingAs="h3" />
			</section>
		</>
	)
}

function GuidelineChapterDescription({
	label,
	description,
	variant,
}: {
	label?: string | null
	description?: string | null
	variant: GuidelineVariant
}) {
	return (
		<section className="px-4 py-24 text-balance">
			{label ? (
				<h2 className="type-title-1 mb-12 max-w-2xl">{label}</h2>
			) : (
				<GuidelineLabelFallback />
			)}
			{description ? (
				<p className="type-body">{description}</p>
			) : (
				<GuidelineDescriptionFallback variant={variant} />
			)}
		</section>
	)
}
