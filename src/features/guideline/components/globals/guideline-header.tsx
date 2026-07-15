import { AspectRatio } from '@/components/ui/aspect-ratio'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from '../blocks/children/guideline-image'
import type { GuidelineVariant } from './guideline-variant'

// 최상위 헤더(section/chapter/onboard). page 헤더는 GuidelinePageHeading으로 분리됨.
// CSS만으로 collapsing sticky: 위 spacer(스크롤하면 사라짐) + 아래 sticky 타이틀 바.
// scrollTop을 읽지 않으므로 높이↔스크롤 피드백 루프(진동)가 없고, JS 리스너가 없어 렉도 없다.
// sticky 바는 부모(section=article, chapter/onboard=wrapper) 전체에서 고정된다.
// 이미지 있으면 기존 16:9 히어로 유지.
const HEADER_HEIGHT = 200 // 스크롤 전 헤더 영역 높이
const BAR_HEIGHT = 88 // 축소·고정 시(타이틀) 높이

export function GuidelineHeader({
	title,
	image,
	as: Heading = 'h1',
	label,
	variant = 'chapter',
}: {
	title: string
	image?: GuidelineDocument['headerImage']
	as?: 'h1' | 'h2'
	label?: string | number
	variant?: GuidelineVariant
}) {
	const hasImage = typeof image === 'object' && image !== null && Boolean(image.url)

	if (hasImage) {
		return (
			<header data-variant={variant}>
				<AspectRatio ratio={16 / 9} className="relative overflow-hidden bg-scrim">
					<GuidelineImage
						image={image}
						className="absolute inset-0 size-full"
						imgClassName="size-full object-cover"
					/>
					<div aria-hidden="true" className="absolute inset-0 bg-scrim/25" />
					<div className="relative z-10 flex size-full items-end p-4 pb-8 text-scrim-foreground">
						<div>
							{label !== undefined && (
								<p className="type-body mb-2 opacity-70">{label}</p>
							)}
							<Heading className="type-large-title text-6xl">{title}</Heading>
						</div>
					</div>
				</AspectRatio>
			</header>
		)
	}

	return (
		<>
			<div aria-hidden="true" style={{ height: HEADER_HEIGHT - BAR_HEIGHT }} />
			<header
				data-variant={variant}
				className="sticky top-0 z-20 flex items-end border-scrim/10 border-b bg-background pb-4"
				style={{ height: BAR_HEIGHT }}
			>
				{label !== undefined && (
					<p className="type-body mr-3 text-foreground-muted">{label}</p>
				)}
				<Heading className="type-large-title text-6xl text-foreground">{title}</Heading>
			</header>
		</>
	)
}
