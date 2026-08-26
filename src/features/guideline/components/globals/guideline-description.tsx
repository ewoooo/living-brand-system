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
			{/*
			 * 🔴 `topic`은 그리지 않는다. 토픽 설명은 화면 어디에도 안 나오기 때문이다
			 *    (`pages/guideline-topic.tsx` 참조 — Figma의 Section Heading도 제목뿐이고,
			 *    14개 토픽 전수 조사에서 값이 하나도 없었다).
			 *    다시 그려야 하면 **호출부부터** 살려야 한다 — 여기 분기만 되살리면 아무 일도 안 난다.
			 */}
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
