import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GetGuidelineSectionOutput } from '../../services/get-guideline-section.service'
import { GuidelineBlocks } from '../blocks/guideline-blocks'
import { GuidelinePageHeading } from '../globals/guideline-page-heading'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineDescriptionFallback } from '../guideline-content-fallbacks'
import { SnsContentsShowcase } from './sns-contents-showcase'

export function GuidelinePage({
	page,
	betterEditor = false,
}: {
	page: GetGuidelineSectionOutput['pages'][number]
	betterEditor?: boolean
}) {
	const variant = 'page' satisfies GuidelineVariant

	return (
		<article id={page.slug} className="mb-40">
			<GuidelinePageHeading title={page.title} label={page.displayOrder + 1} />
			{/* ponytail: sns-contents는 완성도 데모용 하드코딩 컴포지션(의도적 임시부채). CMS 블록화 전까지. */}
			{page.slug === 'sns-contents' ? (
				<SnsContentsShowcase />
			) : (
				<>
					{page.description ? (
						<section className="mt-8 grid gap-4 md:grid-cols-2">
							<RichText
								data={page.description}
								className="type-body space-y-0.5 md:col-start-2"
							/>
						</section>
					) : (
						<GuidelineDescriptionFallback variant={variant} />
					)}
					<GuidelineBlocks blocks={page.blocks} betterEditor={betterEditor} />
				</>
			)}
		</article>
	)
}
