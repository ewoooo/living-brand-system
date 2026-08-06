import config from '@payload-config'
import { getPayload } from 'payload'
import type { ReactNode } from 'react'
import { CarouselWidget } from '@/features/guideline/widgets/carousel/component'
import { CiLockupWidget } from '@/features/guideline/widgets/ci-lockup/component'
import { ClearspaceOverlayWidget } from '@/features/guideline/widgets/clearspace-overlay/component'
import { ClearspaceViewerWidget } from '@/features/guideline/widgets/clearspace-viewer/component'
import { ColorPairingWidget } from '@/features/guideline/widgets/color-pairing/component'
import { ColorPairingRecommendationWidget } from '@/features/guideline/widgets/color-pairing-recommendation/component'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import { ConceptIntroWidget } from '@/features/guideline/widgets/concept-intro/component'
import { DoDontWidget } from '@/features/guideline/widgets/do-dont/component'
import { GlyphGridWidget } from '@/features/guideline/widgets/glyph-grid/component'
import { HdColorPaletteWidget } from '@/features/guideline/widgets/hd-color-palette/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { ImageGridWidget } from '@/features/guideline/widgets/image-grid/component'
import { IncorrectUsageWidget } from '@/features/guideline/widgets/incorrect-usage/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridControlsWidget } from '@/features/guideline/widgets/layout-grid-controls/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoColorVariantWidget } from '@/features/guideline/widgets/logo-color-variant/component'
import { LogoDisplayWidget } from '@/features/guideline/widgets/logo-display/component'
import { LogoGridSpecWidget } from '@/features/guideline/widgets/logo-grid-spec/component'
import { LogoGroupViewerWidget } from '@/features/guideline/widgets/logo-group-viewer/component'
import { LogoViewerWidget } from '@/features/guideline/widgets/logo-viewer/component'
import { MediaShowcaseWidget } from '@/features/guideline/widgets/media-showcase/component'
import { SectionDividerWidget } from '@/features/guideline/widgets/section-divider/component'
import { SeparatedLogoApplicationWidget } from '@/features/guideline/widgets/separated-logo-application/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeScaleWidget } from '@/features/guideline/widgets/type-scale/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'
import type { BrandLogo } from '@/payload-types'

// dev 전용 위젯 갤러리. 위젯 스타일 통일 + 성능 확인용 (로컬에서만 노출, nav 미등록).
// ponytail: registry = 배열 하나, 제너레이터는 반복이 지겨워질 때.
//
// 대부분의 위젯은 인스턴스 입력 없이 자족 렌더하지만, 업로드 관계를 요구하는 위젯은
// 값이 없으면 `return null`이라 빈 칸이 된다. 그래서 여기서 brand-logos를 한 번 조회해
// 그 몇 개에만 실제 파일을 먹인다 — 플레이스홀더로 때우면 위젯이 뭘 그리는지 안 보인다.

/** 파일명으로 로고를 집는다. 갤러리 전용이라 없으면 그 위젯만 빈 칸이 된다. */
function pick(logos: BrandLogo[], filename: string): BrandLogo | null {
	return logos.find((l) => l.filename === filename) ?? null
}

async function buildWidgets(): Promise<{ name: string; node: ReactNode }[]> {
	const payload = await getPayload({ config })
	const { docs: logos } = await payload.find({
		collection: 'brand-logos',
		limit: 200,
		depth: 0,
		overrideAccess: true,
	})

	// 클리어스페이스 위젯은 로고 레이어 + 그리드 레이어를 같은 viewBox로 겹친다.
	const hLogo = pick(logos, 'ko-horizontal-default-logoSpace.svg')
	const hGrid = pick(logos, 'ko-horizontal-default-clearSpace.svg')
	const vLogo = pick(logos, 'ko-vertical-default-logoSpace.svg')
	const vGrid = pick(logos, 'ko-vertical-default-clearSpace.svg')
	// logo-color-variant는 파일명 앞 조각으로 언어를 파싱해 같은 언어의 색상 변형을 조회한다.
	const koLogo = pick(logos, 'ko-horizontal-default.svg')

	return [
		{ name: 'ci-lockup', node: <CiLockupWidget /> },
		{ name: 'hd-color-palette', node: <HdColorPaletteWidget /> },
		{ name: 'color-palette', node: <ColorPaletteWidget /> },
		{ name: 'color-pairing', node: <ColorPairingWidget /> },
		{ name: 'color-pairing-recommendation', node: <ColorPairingRecommendationWidget /> },
		{ name: 'icon-grid', node: <IconGridWidget /> },
		{ name: 'glyph-grid', node: <GlyphGridWidget /> },
		{ name: 'type-specimen', node: <TypeSpecimenWidget /> },
		{ name: 'type-scale', node: <TypeScaleWidget /> },
		{ name: 'logo-viewer', node: <LogoViewerWidget /> },
		{ name: 'logo-group-viewer', node: <LogoGroupViewerWidget /> },
		{ name: 'logo-display', node: <LogoDisplayWidget logo={koLogo} /> },
		{ name: 'logo-color-variant', node: <LogoColorVariantWidget logo={koLogo} /> },
		{ name: 'stem-clear-space', node: <StemClearSpaceWidget /> },
		{
			name: 'clearspace-overlay',
			node: (
				<ClearspaceOverlayWidget logoLayer={hLogo} gridLayer={hGrid} scalePercent={100} />
			),
		},
		{
			name: 'clearspace-viewer',
			node: (
				<ClearspaceViewerWidget
					horizontalLogo={hLogo}
					horizontalGrid={hGrid}
					verticalLogo={vLogo}
					verticalGrid={vGrid}
				/>
			),
		},
		{ name: 'incorrect-usage', node: <IncorrectUsageWidget /> },
		{
			name: 'do-dont',
			node: (
				<DoDontWidget
					imageRatio="1:1"
					columns="3"
					examples={[
						{
							id: 'do',
							kind: 'do',
							image: koLogo,
							caption: '기본형을 그대로 사용합니다.',
						},
						{ id: 'ok', kind: 'ok', image: koLogo, caption: '배경 대비를 확인합니다.' },
						{
							id: 'dont',
							kind: 'dont',
							image: koLogo,
							caption: '비율을 변경할 수 없습니다.',
						},
					]}
				/>
			),
		},
		{ name: 'carousel', node: <CarouselWidget /> },
		{ name: 'image-grid', node: <ImageGridWidget /> },
		{ name: 'media-showcase', node: <MediaShowcaseWidget /> },
		{ name: 'layout-grid', node: <LayoutGridWidget /> },
		{ name: 'layout-grid-controls', node: <LayoutGridControlsWidget /> },
		{ name: 'layout-grid-overlay', node: <LayoutGridOverlayWidget /> },
		{ name: 'section-divider', node: <SectionDividerWidget /> },
		{ name: 'concept-intro', node: <ConceptIntroWidget logo={koLogo} /> },
		{ name: 'logo-grid-spec', node: <LogoGridSpecWidget /> },
		{ name: 'separated-logo-application', node: <SeparatedLogoApplicationWidget /> },
	]
}

export async function GuidelineWidgetGallery() {
	const widgets = await buildWidgets()
	return (
		<div className="flex flex-col gap-16 py-12">
			{widgets.map(({ name, node }) => (
				<section key={name} className="flex flex-col gap-4">
					<h2 className="font-mono text-sm text-muted-foreground">{name}</h2>
					{node}
				</section>
			))}
		</div>
	)
}
