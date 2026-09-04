import { ContentFrame } from '@/components/shared/content-frame'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import {
	surfaceScopeClass,
	surfaceStyle,
} from '@/features/guideline/components/globals/guideline-surface'
import type { GuidelineVariant } from '@/features/guideline/components/globals/guideline-variant'
import { cn } from '@/lib/utils'
import type { GuidelineDocument } from '@/payload-types'
import LayoutBlockComponent from '../block/component'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type SectionBlockType = Extract<GuidelineBlock, { blockType: 'section' }>

// 토픽 안의 꼭지 하나. 2026-08-26까지 별도 문서(3단계 '페이지')였고 마크업은 그대로 옮겨왔다.
//
// 🔴 자식을 `GuidelineBlocks`로 그리지 않는다 — 그쪽은 카탈로그 렌더러를 거치고, 그 렌더러가 이
//    파일을 import하므로 순환이 된다. 자식은 LayoutBlock 하나뿐이라 직접 dispatch하는 편이 맞다.
//
// ponytail: Better Editor 표식(`data-better-editor-id`)은 꼭지에만 붙고 자식 블록에는 안 붙는다.
//    플러그인이 클릭 지점에서 위로 걸어 올라가므로 자식을 눌러도 이 꼭지가 선택되고, 그 안쪽은
//    사이드바 Blocks 탭에서 고른다. 자식까지 집고 싶어지면 렌더러 map 시그니처에 플래그를 더하거나
//    context를 하나 두면 된다.
export function SectionBlock({ block }: { block: SectionBlockType }) {
	const variant = 'section' satisfies GuidelineVariant

	return (
		// 🔴 여백은 **프레임 패딩 + 이 gap의 합**이다(docs/09 §7). 제목 프레임의 아래 패딩 32 +
		//    gap 48 = 80 — Figma(61:3376) Article 안의 제목→배치 간격과 같다. 블록은 자기 면을
		//    프레임 가장자리까지 칠하므로 그쪽 패딩은 여백에 더해지지 않는다(실측).
		//
		// 🔴 꼭지의 면은 여기서 칠한다 — Figma(61:3299)의 Article 면은 제목·본문까지 덮는다.
		//    자식 블록이 자기 면을 갖고 있지만 그것은 배치 영역에서 끊기므로 이 자리를 대신 못 한다.
		<section
			id={block.anchor ?? undefined}
			className={cn(
				'flex flex-col gap-12',
				surfaceScopeClass(block.background, block.backgroundTone),
			)}
			style={surfaceStyle(block.background, block.backgroundTone)}
		>
			<ContentFrame>
				<div className="grid md:grid-cols-2">
					<div className="flex flex-col gap-8 order-2 col-start-2">
						<GuidelineHeader variant={variant} title={block.title} />
						<GuidelineDescription variant={variant} description={block.description} />
					</div>
				</div>
			</ContentFrame>
			<div className="flex flex-col gap-8">
				{(block.blocks ?? []).map((child) => (
					<LayoutBlockComponent key={child.id} block={child} />
				))}
			</div>
		</section>
	)
}

export default SectionBlock
