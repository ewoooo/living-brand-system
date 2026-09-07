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
		<figcaption className="flex flex-col gap-1 px-4 py-6 font-body">
			{title ? <p className="font-semibold text-sm">{title}</p> : null}
			<GuidelineDescription description={description} />
		</figcaption>
	)
}
