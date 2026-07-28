import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuidelineDescription as GuidelineDescriptionData } from '../../repositories/guideline-view.payload.repository'
import { GuidelineDescriptionFallback } from '../guideline-content-fallbacks'
import type { GuidelineVariant } from './guideline-variant'

type Description = NonNullable<GuidelineDescriptionData> | string

// Export
export function GuidelineDescription({
	variant,
	description,
}: {
	variant: GuidelineVariant
	description: GuidelineDescriptionData | string
}) {
	if (!description) return <GuidelineDescriptionFallback variant={variant} />

	return (
		<section className="text-balance">
			{variant === 'onboard' && <OnboardDescription description={description} />}
			{variant === 'chapter' && <ChapterDescription description={description} />}
			{variant === 'section' && <SectionDescription description={description} />}
			{variant === 'page' && <PageDescription description={description} />}
			{variant === 'block' && <BlockDescription description={description} />}
		</section>
	)
}

function OnboardDescription({ description }: { description: Description }) {
	return (
		<DescriptionContent description={description} className="font-body font-normal text-xl" />
	)
}

function ChapterDescription({ description }: { description: Description }) {
	return (
		<DescriptionContent description={description} className="font-body font-normal text-xl" />
	)
}

function SectionDescription({ description }: { description: Description }) {
	return (
		<DescriptionContent description={description} className="font-body font-normal text-xl" />
	)
}

function PageDescription({ description }: { description: Description }) {
	return (
		<DescriptionContent
			description={description}
			className="font-body font-normal text-sm space-y-2 pr-8"
		/>
	)
}

function BlockDescription({ description }: { description: Description }) {
	// whitespace-pre-line: 본문 text 노드에 들어있는 개행(\n)을 줄바꿈으로 렌더한다.
	return (
		<DescriptionContent
			description={description}
			className="font-body font-normal text-sm space-y-2 whitespace-pre-line pr-8"
		/>
	)
}

//  본문 처리
function DescriptionContent({
	description,
	className,
}: {
	description: Description
	className?: string
}) {
	return typeof description === 'string' ? (
		// Onboard는 RichText가 아니므로
		<p className={className}>{description}</p>
	) : (
		<RichText className={className} data={description} />
	)
}
