import { Typography } from '@/components/ui/typography'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import type { BaseBlock } from '@/payload-types'

export type CardCaptionData = NonNullable<NonNullable<BaseBlock['cards']>[number]['caption']>

/**
 * 캡션 = 제목 + 설명. 둘 다 선택이고 하나만 있어도 그린다. 둘 다 비면 `null`이라 figcaption 자체가 없다.
 * 설명의 표(TableFeature)를 라벨·값 스펙 리스트로 바꾸는 컨버터는 여기에 얹는다(Figma 135:488) — 아직 기본 표.
 */
export function CardCaption({ caption }: { caption?: CardCaptionData | null }) {
	const title = caption?.title?.trim()
	const description = caption?.description
	if (!title && !description) return null

	return (
		// Figma 131:272 — 판 폭 안에서 최대 480px. 긴 캡션도 카드의 비율을 밀어내지 않는다.
		<figcaption className="flex w-full max-w-120 flex-col px-4 py-8 font-body tracking-tight wrap-anywhere">
			{title ? (
				<Typography as="p" size="xl" weight="medium" className="leading-[1.55]">
					{title}
				</Typography>
			) : null}
			<GuidelineDescription
				description={description}
				className="pr-0 font-medium text-xl text-muted-foreground leading-[1.55] text-wrap"
			/>
		</figcaption>
	)
}
