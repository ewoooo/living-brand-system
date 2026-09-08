import { cva } from 'class-variance-authority'
import { Typography } from '@/components/ui/typography'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import type { BaseBlock } from '@/payload-types'

export type CardCaptionData = NonNullable<NonNullable<BaseBlock['cards']>[number]['caption']>

const captionVariants = cva('flex w-full flex-col font-body tracking-tight wrap-anywhere', {
	variants: {
		placement: {
			below: 'max-w-120 px-4 py-8',
			// Figma 136:231. 어두운 토큰 스코프로 이미지 위 텍스트와 표의 대비를 함께 유지한다.
			overlay:
				'dark absolute inset-x-0 bottom-0 max-h-full overflow-y-auto overscroll-contain rounded-3xl bg-linear-to-b from-background/0 via-background/95 via-[48px] to-background bg-local px-6 pt-12 pb-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
		},
	},
	defaultVariants: { placement: 'below' },
})

/**
 * 캡션 = 제목 + 설명. 둘 다 선택이고 하나만 있어도 그린다. 둘 다 비면 `null`이라 figcaption 자체가 없다.
 * 배치만 바꾸고 제목·설명·스펙 표는 공유한다. 긴 오버레이 캡션은 판 안에서 스크롤한다.
 */
export function CardCaption({ caption }: { caption?: CardCaptionData | null }) {
	const title = caption?.title?.trim()
	const description = caption?.description
	if (!title && !description) return null
	const placement = caption?.placement ?? 'below'
	const overlay = placement === 'overlay'

	return (
		// Figma 131:272 — 판 폭 안에서 최대 480px. 긴 캡션도 카드의 비율을 밀어내지 않는다.
		<figcaption
			data-slot="card-caption"
			data-placement={placement}
			className={captionVariants({ placement })}
			tabIndex={overlay ? 0 : undefined}
		>
			<div className={overlay ? 'max-w-108' : undefined}>
				{title ? (
					<Typography
						as="p"
						size={overlay ? 'base' : 'xl'}
						weight="medium"
						className="leading-[1.55]"
					>
						{title}
					</Typography>
				) : null}
				<GuidelineDescription
					description={description}
					className={
						overlay
							? 'pr-0 font-medium text-base text-muted-foreground leading-[1.55] text-wrap'
							: 'pr-0 font-medium text-xl text-muted-foreground leading-[1.55] text-wrap'
					}
				/>
			</div>
		</figcaption>
	)
}
