import { ContentHeading } from '@/components/shared/content-heading'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './guideline-image'
import type { GuidelineVariant } from './guideline-variant'

const HEADER_STYLE = {
	onboard: { level: 1, size: '6xl', weight: 'bold' },
	chapter: { level: 1, size: '6xl', weight: 'semibold' },
	// Figma 61:3509는 64px SemiBold다. 공유 어휘의 가장 가까운 칸이 6xl(60px)이라 4px 모자라고,
	// 그 4px 때문에 `text-[64px]`를 들이지는 않는다 — 크기를 어휘 밖에서 말하기 시작하면 다음
	// 제목도 같은 이유로 어휘를 벗어난다. 정확히 64가 필요하면 theme.css의 `--text-6xl`을 옮긴다.
	topic: { level: 1, size: '6xl', weight: 'semibold' },
	section: { level: 2, size: '2xl', weight: 'semibold' },
	block: { level: 3, size: 'base', weight: 'semibold' },
} as const

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
	const style = HEADER_STYLE[variant]

	return (
		<ContentHeading
			title={title}
			level={style.level}
			size={style.size}
			weight={style.weight}
			className={className}
			titleClassName={variant === 'block' ? undefined : 'leading-none tracking-tight'}
		/>
	)
}

/**
 * 히어로가 없는 토픽의 폴백. 🔴 리포의 정적 에셋이라 **환경마다 업로드하지 않아도** 뜬다 —
 * 업로드는 배포를 따라가지 않으므로(`CLAUDE.md` Content Provisioning) 토픽 14개 × 환경 수만큼
 * 사람이 옮겨야 비로소 보이는 상태가 된다. 문서에 `headerImage`가 있으면 그쪽이 이긴다.
 */
const HERO_FALLBACK = { url: '/images/hero_guideline.png' }

export function GuidelineHeaderImage({ image }: { image?: GuidelineDocument['headerImage'] }) {
	const value = typeof image === 'object' && image?.url ? image : HERO_FALLBACK

	return (
		<GuidelineImage
			variant="topic"
			image={value}
			// 비율은 Figma(61:3503)의 프레임 실측이라 `ratio` 어휘에 없다 — admin이 고르는 값이
			// 아니고 이 자리 하나에만 쓰이므로 목록을 늘리지 않고 여기서 직접 준다.
			ratio="original"
			className="aspect-[1509/450] w-full overflow-hidden rounded-xl bg-scrim"
			imgClassName="size-full object-cover"
		/>
	)
}
