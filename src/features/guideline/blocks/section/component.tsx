import { ContentFrame } from '@/components/shared/content-frame'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { GuidelineHelperRegion } from '@/features/guideline/components/globals/guideline-helper'
import { GuidelineControllerPill } from '@/features/guideline/controllers/pill'
import { GuidelineControllerScope } from '@/features/guideline/controllers/provider'
import { controllerEntryFor } from '@/features/guideline/controllers/registry'
import { type GuidelineLeaf, renderLeaf } from '@/features/guideline/leaves/render-leaf'
import { cn } from '@/lib/utils'
import type { SectionBlock as SectionBlockType } from '@/payload-types'
import { LEAF_GRID, LEAF_SPAN, RIGHT_HALF } from '../shared/rhythm'

/**
 * 컨트롤은 격자가 아니라 **화면 하단의 Floating Controller**에 온다(components/globals/guideline-helper.tsx).
 * 격자 셀에 두면 셀 하나를 차지하고, 스크롤을 내리면 조작 대상만 남고 손잡이가 화면 밖으로 나간다.
 *
 * 🔑 **이 렌더러는 어떤 위젯이 컨트롤러인지 모른다.** 레지스트리에 물어볼 뿐이다(`controllers/registry.ts`).
 * 값 스코프는 **섹션 단위**다 — 한 섹션의 판형들이 슬라이더 하나를 공유한다. 섹션당 컨트롤러는 하나고,
 * 먼저 선언한 leaf가 이긴다.
 */
function splitControls(children: GuidelineLeaf[]) {
	const source = children.find((leaf) => controllerEntryFor(leaf.blockType))
	const entry = source ? controllerEntryFor(source.blockType) : undefined
	// 자기 그림이 있는 위젯은 격자에 남는다 — 걷어내는 것은 그릴 것이 없는 패널뿐이다.
	const arranged = children.filter((leaf) => !controllerEntryFor(leaf.blockType)?.panelOnly)
	const controller =
		source && entry
			? { manifest: entry.manifest, restrictions: entry.toRestrictions({ ...source }) }
			: null
	return { controller, arranged }
}

/**
 * 토픽 안의 섹션 하나 — 제목·설명(오른쪽 반칸)과 leaf 격자. 디자인 정본은 Figma 61:3299·61:3376의 Article.
 *
 * 🔴 제목이 없으면 머리도 앵커도 만들지 않는다(히어로 락업용, schema.ts 참조).
 * 🔴 여백은 **프레임 패딩 + gap의 합**이다(docs/09 §7). 제목 프레임의 아래 패딩 32 + gap 48 = 80 —
 *    Figma Article 안의 제목→배치 간격과 같다.
 */
export function SectionBlock({ block }: { block: SectionBlockType }) {
	const { controller, arranged } = splitControls(block.children ?? [])
	const title = block.title?.trim() || null

	const grid = (
		<div className={LEAF_GRID}>
			{arranged.map((leaf) => (
				<div key={leaf.id} className={LEAF_SPAN[leaf.span ?? 'full']}>
					{renderLeaf(leaf)}
				</div>
			))}
		</div>
	)

	// 관측 영역은 **판형이 놓인 격자**다 — 제목·설명이 아니다. 조작 대상이 화면에서 사라지면
	// 컨트롤도 함께 물러나야 슬라이더를 움직였는데 아무 변화가 없는 상태가 생기지 않는다.
	const body = controller ? (
		<GuidelineControllerScope
			manifest={controller.manifest}
			restrictions={controller.restrictions}
		>
			<GuidelineHelperRegion label={title} controls={<GuidelineControllerPill />}>
				{grid}
			</GuidelineHelperRegion>
		</GuidelineControllerScope>
	) : (
		grid
	)

	return (
		<section
			id={title ? (block.anchor ?? undefined) : undefined}
			className="flex flex-col gap-12"
		>
			{title ? (
				<ContentFrame>
					<div className={RIGHT_HALF.grid}>
						<div className={cn('flex flex-col gap-8', RIGHT_HALF.cell)}>
							<GuidelineHeader variant="section" title={title} />
							<GuidelineDescription description={block.description} />
						</div>
					</div>
				</ContentFrame>
			) : null}
			<ContentFrame>{body}</ContentFrame>
		</section>
	)
}

export default SectionBlock
