import type { ReactNode } from 'react'
import { IconGridDemo } from './icon-grid'
import { LayoutGridOverlayDemo } from './layout-grid-overlay'
import { LogoClearSpaceCheckerDemo } from './logo-clear-space-checker'
import { LogoVariantSelectorDemo } from './logo-variant-selector'
import { PaletteCombinationPickerDemo } from './palette-combination-picker'
import { ScrollCarouselDemo } from './scroll-carousel'

// 프로토타입 전용 랩 갤러리 — 아직 제품/블록 시스템에 연결되지 않은 독립 컴포넌트만 전시한다.
function LabItem({ title, note, children }: { title: string; note: string; children: ReactNode }) {
	return (
		<section className="border-border border-t pt-8">
			<h3 className="font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{title}
			</h3>
			<p className="mt-1 mb-5 font-body font-normal text-muted-foreground text-sm">{note}</p>
			{children}
		</section>
	)
}

export function GuidelineKitLabGallery() {
	return (
		<article className="flex w-full flex-col gap-12">
			<header>
				<p className="font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
					UI Kit · Lab
				</p>
				<h1 className="mt-1 font-body font-bold text-2xl">프로토타입 컴포넌트 랩</h1>
				<p className="mt-2 font-body font-normal text-muted-foreground text-sm">
					블록 시스템과 무관한 독립 프로토타입. 검증 후 선별해 블록으로 승격한다.
				</p>
			</header>

			<LabItem
				title="1 · Scroll Carousel"
				note="세로 스크롤로 가로 슬라이드가 넘어가는 풀폭 캐러셀."
			>
				<ScrollCarouselDemo />
			</LabItem>
			<LabItem
				title="2 · Logo Variant Selector"
				note="로고/배경을 골라 프리뷰를 즉시 갱신 (cash.app/logo 구조 차용)."
			>
				<LogoVariantSelectorDemo />
			</LabItem>
			<LabItem
				title="3 · Palette Combination Picker"
				note="전경색 선택 시 함께 쓸 수 있는 배경색만 활성화."
			>
				<PaletteCombinationPickerDemo />
			</LabItem>
			<LabItem title="4 · Icon Grid" note="사용 가능한 아이콘 그리드, 호버 시 설명 툴팁.">
				<IconGridDemo />
			</LabItem>
			<LabItem
				title="5 · Layout Grid Overlay"
				note="인쇄물 위에 컬럼 그리드를 on/off로 겹쳐 검수."
			>
				<LayoutGridOverlayDemo />
			</LabItem>
			<LabItem
				title="6 · Logo Clear-space Checker"
				note="로고 위에 최소 여백 가이드를 on/off로 겹쳐 여백 충분 여부 테스트."
			>
				<LogoClearSpaceCheckerDemo />
			</LabItem>
		</article>
	)
}
