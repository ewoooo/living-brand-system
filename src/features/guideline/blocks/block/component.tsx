import type { ReactNode } from 'react'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { GuidelineHelperRegion } from '@/features/guideline/components/globals/guideline-helper'
import { GuidelineControllerPill } from '@/features/guideline/controllers/pill'
import { GuidelineControllerScope } from '@/features/guideline/controllers/provider'
import { controllerEntryFor } from '@/features/guideline/controllers/registry'
import { ClearspaceOverlayWidget } from '@/features/guideline/widgets/clearspace-overlay/component'
import { ClearspaceViewerWidget } from '@/features/guideline/widgets/clearspace-viewer/component'
import { DoDontWidget } from '@/features/guideline/widgets/do-dont/component'
import { HAIRLINE_GRID } from '@/features/guideline/widgets/hairline'
import { HdColorPaletteWidget } from '@/features/guideline/widgets/hd-color-palette/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoBgPickerWidget } from '@/features/guideline/widgets/logo-bg-picker/component'
import { LogoColorVariantWidget } from '@/features/guideline/widgets/logo-color-variant/component'
import { LogoDisplayWidget } from '@/features/guideline/widgets/logo-display/component'
import { LogoOnBackgroundWidget } from '@/features/guideline/widgets/logo-on-background/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeHierarchyWidget } from '@/features/guideline/widgets/type-hierarchy/component'
import { TypeLanguageWidget } from '@/features/guideline/widgets/type-language/component'
import { TypeScrambleWidget } from '@/features/guideline/widgets/type-scramble/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'
import { TypeWeightWidget } from '@/features/guideline/widgets/type-weight/component'
import { isLightColor } from '@/lib/color'
import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES, type ImageRatio } from '@/types/image-ratio'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

// 레이아웃 컨테이너: 프레임/폭(width)·배치(arrangement·columns)를 소유하고 자식 leaf를 dispatch 렌더한다.
// leaf = Image(정적) | Widget(인터랙티브) 형제. top-level renderer.generated엔 leaf가 없어 여기서 직접 매핑.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LayoutBlockType = Extract<GuidelineBlock, { blockType: 'block' }>
type Child = NonNullable<LayoutBlockType['children']>[number]

// 위젯은 전부 인스턴스 입력 없이 자족 렌더(brand-*/폰트 스스로 조회).
function renderWidget(child: Child): ReactNode {
	switch (child.blockType) {
		case 'clearspaceOverlayWidget':
			return (
				<ClearspaceOverlayWidget
					logoLayer={child.logoLayer}
					gridLayer={child.gridLayer}
					scalePercent={child.scalePercent}
				/>
			)
		case 'clearspaceViewerWidget':
			return (
				<ClearspaceViewerWidget
					horizontalLogo={child.horizontalLogo}
					horizontalGrid={child.horizontalGrid}
					horizontalMinHeightPx={child.horizontalMinHeightPx}
					verticalLogo={child.verticalLogo}
					verticalGrid={child.verticalGrid}
					verticalMinHeightPx={child.verticalMinHeightPx}
				/>
			)
		case 'iconGridWidget':
			return <IconGridWidget />
		case 'stemClearSpaceWidget':
			return <StemClearSpaceWidget />
		case 'hdColorPaletteWidget':
			// 고른 그룹을 고른 순서대로 한 행씩, 비우면 전체를 그린다.
			// layout은 그룹 간 우열 유무를 말한다(균일 정사각형 / 순위별 높이).
			return <HdColorPaletteWidget groups={child.groups} layout={child.layout} />
		case 'doDontWidget':
			// 예시(이미지 또는 컬러 프리셋 + 캡션 + kind)를 인스턴스 입력으로 받는 위젯.
			// logo는 컬러 프리셋에만 쓰인다 — 이미지 예시만 있으면 조회조차 하지 않는다.
			return (
				<DoDontWidget
					imageRatio={child.imageRatio}
					columns={child.columns}
					itemLabel={child.itemLabel}
					logo={child.logo}
					examples={child.examples}
				/>
			)
		case 'layoutGridWidget':
			// 샘플 디자인은 코드에 있고 인스턴스는 그중 하나를 고른다.
			return (
				<LayoutGridWidget
					sample={child.sample}
					caption={child.caption}
					guides={child.guides}
					marginPct={child.marginPct}
					gutterX={child.gutterX}
					gutterY={child.gutterY}
				/>
			)
		case 'layoutGridOverlayWidget':
			return <LayoutGridOverlayWidget />
		case 'logoColorVariantWidget':
			// 인스턴스 입력(logo)을 받는 위젯 — 자족 렌더 위젯들과 다름.
			return <LogoColorVariantWidget logo={child.logo} />
		case 'logoBgPickerWidget':
			// 배경 하나 위에 CI 두 표현을 동시에 놓고 picker로 배경만 바꾼다(블록당 하나).
			return <LogoBgPickerWidget group={child.group} logo={child.logo} />
		case 'logoDisplayWidget':
			// logo를 pin해서 받는 위젯(fishing 없음) + 유한 사이징(width/height/padding).
			return (
				<LogoDisplayWidget
					logo={child.logo}
					width={child.width}
					height={child.height}
					padding={child.padding}
				/>
			)
		case 'logoOnBgWidget':
			return (
				<LogoOnBackgroundWidget
					group={child.group}
					logo={child.logo}
					column={child.column}
				/>
			)
		case 'typeHierarchyWidget':
			return <TypeHierarchyWidget language={child.language} />
		case 'typeLanguageWidget':
			return (
				<TypeLanguageWidget initialLanguage={child.initialLanguage} layout={child.layout} />
			)
		case 'typeScrambleWidget':
			return (
				<TypeScrambleWidget
					text={child.text}
					fontSize={child.fontSize}
					panelHeight={child.panelHeight}
					color={child.color}
					background={child.background}
					weight={child.weight}
				/>
			)
		case 'typeWeightWidget':
			return (
				<TypeWeightWidget
					layout={child.layout}
					language={child.language}
					initialWeight={child.initialWeight}
				/>
			)
		case 'typeSpecimenWidget':
			return <TypeSpecimenWidget />
		default:
			return null
	}
}

// aspectClass 있음(grid·carousel·featured): 고정 비율 셀 + object-cover로 block 내 모든 이미지 렌더 크기 균일(넘치면 크롭).
// aspectClass 빈 문자열(masonry, 또는 aspectRatio='original'): 원본 비율(h-auto) 유지.
// 위젯은 인터랙티브라 aspect 박스로 감싸면 깨져 — 이미지 leaf에만 비율 적용.
function renderChild(child: Child, aspectClass: string): ReactNode {
	if (child.blockType === 'image') {
		const image = typeof child.image === 'object' ? child.image : null
		if (!image?.url) return null
		const alt = image.alt ?? image.name ?? ''
		if (!aspectClass) {
			// biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용.
			return <img src={image.url} alt={alt} className="block h-auto w-full" />
		}
		return (
			<div className={`w-full overflow-hidden ${aspectClass}`}>
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
				<img src={image.url} alt={alt} className="size-full object-cover" />
			</div>
		)
	}
	return renderWidget(child)
}

// arrangement별 배치. grid/carousel/featured는 균일 셀(aspectRatio), masonry는 원본 비율(높이 가변).
function Arrange({
	arrangement,
	columns,
	gap,
	aspectRatio,
	items,
}: {
	arrangement: LayoutBlockType['arrangement']
	columns: number
	gap: LayoutBlockType['gap']
	aspectRatio: ImageRatio
	items: NonNullable<LayoutBlockType['children']>
}) {
	const cols = Math.max(1, columns)
	// 🔴 맞붙임은 gap 0이 아니라 **gap 1px + 그리드 배경**이다. gap을 0으로 두면 셀마다 가진 테두리가
	//    맞닿아 2px이 되고, 셀에서 테두리를 걷어내면 이번엔 선이 아예 사라진다. 틈을 선 색으로 칠하면
	//    선은 어디서나 정확히 1px이고, 그리는 주체가 배치(Block) 하나로 모인다.
	//    padding까지 줘야 바깥 테두리도 같은 선으로 닫힌다. 규칙은 hairline.ts가 소유한다.
	const gridGap = gap === 'none' ? HAIRLINE_GRID : 'gap-4'
	// masonry는 원본 비율(빈 문자열), 그 외는 aspectRatio 클래스(original도 빈 문자열이라 h-auto).
	const aspectClass = arrangement === 'masonry' ? '' : IMAGE_RATIO_CLASS_NAMES[aspectRatio]

	if (arrangement === 'carousel') {
		return (
			<div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
				{items.map((child) => (
					<div
						key={child.id}
						className="shrink-0 basis-4/5 snap-center sm:basis-1/2 lg:basis-1/3"
					>
						{renderChild(child, aspectClass)}
					</div>
				))}
			</div>
		)
	}

	if (arrangement === 'masonry') {
		return (
			<div className="gap-4 [column-gap:1rem]" style={{ columnCount: cols }}>
				{items.map((child) => (
					<div key={child.id} className="mb-4 break-inside-avoid">
						{renderChild(child, '')}
					</div>
				))}
			</div>
		)
	}

	if (arrangement === 'featured') {
		// 첫 자식 전폭으로 강조 + 나머지는 columns 그리드.
		const [first, ...rest] = items
		return (
			<div className="flex flex-col gap-4">
				{first ? <div>{renderChild(first, aspectClass)}</div> : null}
				{rest.length > 0 ? (
					<div
						className={`grid ${gridGap}`}
						style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
					>
						{rest.map((child) => (
							<div key={child.id}>{renderChild(child, aspectClass)}</div>
						))}
					</div>
				) : null}
			</div>
		)
	}

	// grid(기본) — columns 열 × 자동 행 wrap.
	return (
		<div
			className={`grid ${gridGap}`}
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
		>
			{items.map((child) => (
				<div key={child.id}>{renderChild(child, aspectClass)}</div>
			))}
		</div>
	)
}

// brand-colors 참조에서 hex를 뽑는다(데이터 색 → inline style, 닫힌 토큰 규칙의 색-데이터 예외).
function bgHex(color: LayoutBlockType['background']): string | undefined {
	return color && typeof color === 'object' && color.hex ? color.hex : undefined
}

/**
 * 색을 데이터로 주입한 면의 **토큰 스코프**를 함께 선언한다.
 *
 * 🔴 배경 hex만 인라인으로 넣으면 프레임 variant가 배경·전경을 짝으로 갖고 있던 것을 우회한다.
 *    라이트 모드 페이지에 어두운 브랜드 색을 깔면 면만 어두워지고, 안쪽 위젯은 라이트 팔레트의
 *    near-black 컨트롤을 그대로 그려 어두운 면에 묻힌다. 반대도 같다 — 다크 모드에 흰 면을 깔면
 *    밝은 전경이 흰 면에서 사라진다. 면을 칠하는 자리에서 스코프를 뒤집어 두면 시맨틱 토큰만 쓰는
 *    위젯은 전경·테두리·muted가 전부 따라온다.
 *
 * 위젯·블록에 `dark:` 변형은 0건이라 토큰 재선언만으로 충분하다. `dark:`를 쓰기 시작하면 다크
 * 페이지 안의 밝은 섬에서는 그 변형이 여전히 걸린다는 점(`.dark *` 후손 선택자)을 같이 봐야 한다.
 */
function surfaceScopeClass(hex: string | undefined): string | undefined {
	if (!hex) return undefined
	// text-foreground를 함께 준다 — 색 클래스가 없는 면은 바깥에서 **계산된** 색을 상속하므로
	// 토큰만 다시 선언해서는 글자 색이 따라오지 않는다.
	return `${isLightColor(hex) ? 'light' : 'dark'} text-foreground`
}

// 컨트롤은 배치 영역이 아니라 **화면 하단의 Floating Controller**에 온다
// (components/globals/guideline-helper.tsx). 배치 셀 안에 두면 셀 하나를 차지하고 판형과 같은
// 어두운 면에 얹혀 읽기 어려우며, 스크롤을 내리면 조작 대상만 남고 손잡이가 화면 밖으로 나간다.
//
// 🔑 **이 렌더러는 어떤 위젯이 컨트롤러인지 모른다.** 레지스트리에 물어볼 뿐이다
// (`controllers/registry.ts`). 그래서 컨트롤러를 여는 위젯이 늘어도 여기는 안 바뀐다.
//
// 값 스코프는 **블록 단위**다: 모듈 스토어로 두면 섹션 라우트가 여러 Page를 한 화면에 렌더할 때
// 페이지마다 놓인 컨트롤이 서로 간섭한다. 그래서 컨트롤과 배치를 한 provider로 함께 감싼다 —
// 하단 바로 가는 것은 DOM뿐이고 React 트리는 이 provider 안에 남는다.
function splitControls(children: NonNullable<LayoutBlockType['children']>) {
	// 🔴 블록당 컨트롤러는 하나다 — 값 스코프가 블록 단위이므로 둘을 켜면 나중 것이 먼저 것을
	//    덮는다. 먼저 선언한 자식이 이긴다.
	const source = children.find((child) => controllerEntryFor(child.blockType))
	const entry = source ? controllerEntryFor(source.blockType) : undefined
	// 자기 그림이 있는 위젯은 배치에 남는다 — 걷어내는 것은 그릴 것이 없는 패널뿐이다.
	const arranged = children.filter((child) => !controllerEntryFor(child.blockType)?.panelOnly)
	// 자식이 컨트롤러를 열지 않으면 매니페스트도 제한도 없다.
	const controller =
		source && entry
			? // 위젯 필드를 이름 가방으로 넘긴다 — 필드 이름을 아는 것은 레지스트리 하나뿐이다.
				{ manifest: entry.manifest, restrictions: entry.toRestrictions({ ...source }) }
			: null
	return { controller, arranged }
}

export function LayoutBlock({ block }: { block: LayoutBlockType }) {
	const outerBg = bgHex(block.background)
	const innerBg = bgHex(block.innerBackground)
	const { controller, arranged } = splitControls(block.children ?? [])

	const arrangedSurface = (
		<div
			className={surfaceScopeClass(innerBg)}
			style={innerBg ? { background: innerBg } : undefined}
		>
			<Arrange
				arrangement={block.arrangement}
				columns={block.columns ?? 2}
				gap={block.gap ?? 'default'}
				aspectRatio={block.aspectRatio ?? '1:1'}
				items={arranged}
			/>
		</div>
	)

	// 관측 영역은 **판형이 놓인 면**이다 — 제목·설명이 아니다. 조작 대상이 화면에서 사라지면
	// 컨트롤도 함께 물러나야 슬라이더를 움직였는데 아무 변화가 없는 상태가 생기지 않는다.
	const body = controller ? (
		<GuidelineControllerScope
			manifest={controller.manifest}
			restrictions={controller.restrictions}
		>
			<GuidelineHelperRegion label={block.title} controls={<GuidelineControllerPill />}>
				{arrangedSurface}
			</GuidelineHelperRegion>
		</GuidelineControllerScope>
	) : (
		arrangedSurface
	)

	return (
		<GuidelineBlockFrame
			layout={block.width ?? 'padded'}
			className={surfaceScopeClass(outerBg)}
			style={outerBg ? { background: outerBg } : undefined}
		>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			{block.description ? (
				<GuidelineDescription variant="block" description={block.description} />
			) : null}
			{body}
		</GuidelineBlockFrame>
	)
}

export default LayoutBlock
