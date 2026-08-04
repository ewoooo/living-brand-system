import { CarouselWidget } from '@/features/guideline/widgets/carousel/component'
import { CiLockupWidget } from '@/features/guideline/widgets/ci-lockup/component'
import { ColorPairingWidget } from '@/features/guideline/widgets/color-pairing/component'
import { ColorPairingRecommendationWidget } from '@/features/guideline/widgets/color-pairing-recommendation/component'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import { GlyphGridWidget } from '@/features/guideline/widgets/glyph-grid/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { ImageGridWidget } from '@/features/guideline/widgets/image-grid/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridControlsWidget } from '@/features/guideline/widgets/layout-grid-controls/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoGroupViewerWidget } from '@/features/guideline/widgets/logo-group-viewer/component'
import { LogoViewerWidget } from '@/features/guideline/widgets/logo-viewer/component'
import { MediaShowcaseWidget } from '@/features/guideline/widgets/media-showcase/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeScaleWidget } from '@/features/guideline/widgets/type-scale/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'

// dev 전용 위젯 갤러리. 위젯 스타일 통일 + 성능 확인용 (로컬에서만 노출, nav 미등록).
// 위젯이 늘면 이 배열을 자동 카탈로그로 대체. 지금은 수동으로 충분.
// ponytail: registry = 배열 하나, 제너레이터는 반복이 지겨워질 때.
const WIDGETS: { name: string; Component: React.ComponentType }[] = [
	{ name: 'ci-lockup', Component: CiLockupWidget },
	{ name: 'color-palette', Component: ColorPaletteWidget },
	{ name: 'color-pairing', Component: ColorPairingWidget },
	{ name: 'color-pairing-recommendation', Component: ColorPairingRecommendationWidget },
	{ name: 'icon-grid', Component: IconGridWidget },
	{ name: 'glyph-grid', Component: GlyphGridWidget },
	{ name: 'type-specimen', Component: TypeSpecimenWidget },
	{ name: 'type-scale', Component: TypeScaleWidget },
	{ name: 'logo-viewer', Component: LogoViewerWidget },
	{ name: 'logo-group-viewer', Component: LogoGroupViewerWidget },
	{ name: 'stem-clear-space', Component: StemClearSpaceWidget },
	{ name: 'carousel', Component: CarouselWidget },
	{ name: 'image-grid', Component: ImageGridWidget },
	{ name: 'media-showcase', Component: MediaShowcaseWidget },
	{ name: 'layout-grid', Component: LayoutGridWidget },
	{ name: 'layout-grid-controls', Component: LayoutGridControlsWidget },
	{ name: 'layout-grid-overlay', Component: LayoutGridOverlayWidget },
]

export function GuidelineWidgetGallery() {
	return (
		<div className="flex flex-col gap-16 py-12">
			{WIDGETS.map(({ name, Component }) => (
				<section key={name} className="flex flex-col gap-4">
					<h2 className="font-mono text-sm text-muted-foreground">{name}</h2>
					<Component />
				</section>
			))}
		</div>
	)
}
