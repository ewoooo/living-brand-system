import { ContentFrame } from '@/components/shared/content-frame'
import { Typography } from '@/components/ui/typography'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

/**
 * 페이지 하단(챕터 이동 → 푸터)은 본문과 같은 면을 쓰고, 경계는 `border-border`가 만든다.
 * 반전 면으로 계단을 만들었더니 다크에서 아래로 갈수록 밝아져 하단이 페이지에서 가장 눈에 띄었다.
 * 면은 이 껍질이 갖고 폭·여백은 ContentFrame이 갖는다(docs/09 §7).
 *
 * 높이 = 떠 있는 컨트롤의 `inset*2 + height`. 그래서 스크롤을 끝까지 내리면 셸 우하단에 떠 있는
 * 테마 전환이 이 푸터의 수직 중앙에 정확히 온다 — 눈대중이 아니라 계산으로 참이고, 토큰 값을
 * 바꿔도 관계가 유지된다(`layout.tsx`의 ThemeToggle이 같은 토큰을 본다).
 */
export async function GlobalFooter() {
	const { companyName } = await getGuidelineMetadata()

	return (
		<footer
			data-slot="global-footer"
			className="flex min-h-[calc(var(--floating-control-inset)*2+var(--floating-control-height))] w-full items-center border-border border-t bg-background font-body font-normal text-muted-foreground text-sm"
		>
			<ContentFrame className="py-0">
				<section className="flex w-full items-center justify-between">
					<Typography as="p" size="xs">
						© {companyName}. All rights reserved.
					</Typography>
				</section>
			</ContentFrame>
		</footer>
	)
}
