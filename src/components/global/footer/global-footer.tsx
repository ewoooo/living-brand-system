import { ContentFrame } from '@/components/shared/content-frame'
import { Typography } from '@/components/ui/typography'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

/**
 * 페이지 하단은 챕터 이동 → 푸터로 이어지는 반전 면의 명도 계단이다.
 * 챕터 이동이 얕은 단계(`surface-inverted`), 푸터가 깊은 단계(`foreground`)를 갖는다 — 두 모드 모두
 * 푸터가 페이지 배경에서 더 멀어, 아래로 갈수록 무거워지는 순서가 유지된다.
 * 면은 이 껍질이 갖고 폭·여백은 ContentFrame이 갖는다(docs/09 §7).
 */
export async function GlobalFooter() {
	const { companyName } = await getGuidelineMetadata()

	return (
		<footer
			data-slot="global-footer"
			className="w-full bg-foreground font-body font-normal text-background text-sm"
		>
			{/* 아래로 크게 비운다 — 페이지 끝이라는 신호를 여백이 맡는다.
			    6rem은 Carbon 간격 스케일의 위에서 두 번째 단계다(docs/09 §9). */}
			<ContentFrame className="pb-24">
				<section className="flex w-full items-center justify-between">
					<Typography as="p" size="xs">
						© {companyName}. All rights reserved.
					</Typography>
				</section>
			</ContentFrame>
		</footer>
	)
}
