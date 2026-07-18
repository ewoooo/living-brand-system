import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './guideline-image'
import type { GuidelineVariant } from './guideline-variant'

// 최상위 헤더(section/chapter/onboard). page 헤더는 GuidelinePageHeading으로 분리됨.
// CSS만으로 collapsing sticky: 위 spacer(스크롤하면 사라짐) + 아래 sticky 타이틀 바.
// scrollTop을 읽지 않으므로 높이↔스크롤 피드백 루프(진동)가 없고, JS 리스너가 없어 렉도 없다.
// sticky 바는 부모(section=article, chapter/onboard=wrapper) 전체에서 고정된다.
// 이미지 있으면 기존 16:9 히어로 유지.
export function GuidelineHeader({
	title,
	variant = 'chapter',
	className,
}: {
	title?: string | null
	variant?: GuidelineVariant
	className?: string
}) {
	if (!title) return null

	return (
		<header>
			{variant === 'onboard' && <OnboardHeader title={title} />}
			{variant === 'chapter' && <ChapterHeader title={title} />}
			{variant === 'section' && <SectionHeader title={title} />}
			{variant === 'page' && <PageHeader title={title} />}
			{variant === 'block' && <BlockHeader title={title} className={className} />}
		</header>
	)
}

export function GuidelineHeaderImage({ image }: { image?: GuidelineDocument['headerImage'] }) {
	if (typeof image !== 'object' || image === null || !image.url) return null

	return (
		<GuidelineImage
			variant="section"
			image={image}
			ratio="16:9"
			className="w-full overflow-hidden bg-scrim"
			imgClassName="size-full object-cover"
		/>
	)
}

function OnboardHeader({ title }: { title: string }) {
	return (
		<h1 className="font-bold text-9xl text-foreground leading-none tracking-tight">{title}</h1>
	)
}

function ChapterHeader({ title }: { title: string }) {
	return (
		<h1 className="font-semibold text-9xl text-foreground leading-none tracking-tight">
			{title}
		</h1>
	)
}

function SectionHeader({ title }: { title: string }) {
	return (
		<h2 className="font-medium text-8xl text-foreground leading-none tracking-tight">
			{title}
		</h2>
	)
}

function PageHeader({ title }: { title: string }) {
	return (
		<h3 className="font-semibold text-4xl text-foreground leading-none tracking-tight">
			{title}
		</h3>
	)
}

function BlockHeader({ title, className }: { title: string; className?: string }) {
	return <h3 className={`mb-6 font-body text-xl font-bold ${className ?? ''}`}>{title}</h3>
}
