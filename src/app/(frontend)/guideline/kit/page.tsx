import { BigImage } from '@/features/guideline/components/kit/big-image'
import { CarouselDemo } from '@/features/guideline/components/kit/carousel'
import { ClearSpace } from '@/features/guideline/components/kit/clear-space'
import { ColorPalette } from '@/features/guideline/components/kit/color-palette'
import { DataTableDemo } from '@/features/guideline/components/kit/data-table'
import { DoDont } from '@/features/guideline/components/kit/do-dont'
import { DownloadCardDemo } from '@/features/guideline/components/kit/download-card'
import { GlyphGrid } from '@/features/guideline/components/kit/glyph-grid'
import { GridSystemDiagramDemo } from '@/features/guideline/components/kit/grid-system-diagram'
import { ImageGroupDemo } from '@/features/guideline/components/kit/image-group'
import { ImageTextGrid } from '@/features/guideline/components/kit/image-text-grid'
import { LogoLockupDemo } from '@/features/guideline/components/kit/logo-lockup'
import { MediaTextDemo } from '@/features/guideline/components/kit/media-text'
import { RuleCalloutDemo } from '@/features/guideline/components/kit/rule-callout'
import { SignatureDisplayDemo } from '@/features/guideline/components/kit/signature-display'
import { SpecListDemo } from '@/features/guideline/components/kit/spec-list'
import { SpecTable } from '@/features/guideline/components/kit/spec-table'
import { TypeScale } from '@/features/guideline/components/kit/type-scale'
import { TypeSpecimen } from '@/features/guideline/components/kit/type-specimen'

// UI 키트 갤러리(중간공유용). 데이터 비연결 — mock으로 컴포넌트만 전시한다.
// nav 미연결. 나중에 각 컴포넌트를 Payload 블록 렌더러에 어댑터로 연결한다.
// 섹션: 이미지+텍스트(최빈) / 타이포그래피 / 컬러 / 기타.

const placeholder = (label: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d4d4d4"/><text x="320" y="188" font-family="sans-serif" font-size="28" fill="#737373" text-anchor="middle">${label}</text></svg>`,
	)}`

const logoPlaceholder = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80"><rect width="220" height="80" rx="12" fill="#171717"/><text x="110" y="52" font-family="sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">LOGO</text></svg>`,
)}`

const mainColors = [
	[
		{ name: 'Essenherb Red', hex: '#EA5343', pantone: 'Warm Red C' },
		{ name: 'White', hex: '#FFFFFF' },
		{ name: 'Black', hex: '#000000' },
	],
]

const multiColors = [
	[
		{ name: 'Red 1', hex: '#FFF0EB', pantone: '705C' },
		{ name: 'Red 2', hex: '#FFB4AA', pantone: '169C' },
		{ name: 'Essenherb Red', hex: '#EA5343', pantone: 'Warm Red C' },
		{ name: 'Red 4', hex: '#871400', pantone: '7620C' },
		{ name: 'Red 5', hex: '#460500', pantone: '188C' },
	],
	[
		{ name: 'Yellow 1', hex: '#FFFAC2', pantone: '600C' },
		{ name: 'Yellow 2', hex: '#FFF095', pantone: '602C' },
		{ name: 'Yellow 3', hex: '#FFE65F', pantone: '7404C' },
		{ name: 'Yellow 4', hex: '#A07D0F', pantone: '118C' },
		{ name: 'Yellow 5', hex: '#503200', pantone: '7575C' },
	],
	[
		{ name: 'Green 1', hex: '#E6FFE6', pantone: '2253C' },
		{ name: 'Green 2', hex: '#A7F5AE', pantone: '2255C' },
		{ name: 'Green 3', hex: '#50AE5F', pantone: '2257C' },
		{ name: 'Green 4', hex: '#195F30', pantone: '555C' },
		{ name: 'Green 5', hex: '#002B1E', pantone: '567C' },
	],
	[
		{ name: 'Blue 1', hex: '#E1F0FF', pantone: '657C' },
		{ name: 'Blue 2', hex: '#A5CDFF', pantone: '2717C' },
		{ name: 'Blue 3', hex: '#3C87CD', pantone: '279C' },
		{ name: 'Blue 4', hex: '#1E508C', pantone: '2161C' },
		{ name: 'Blue 5', hex: '#001941', pantone: '2768C' },
	],
	[
		{ name: 'Purple 1', hex: '#FAEBFF', pantone: '531C' },
		{ name: 'Purple 2', hex: '#EBC8E9', pantone: '529C' },
		{ name: 'Purple 3', hex: '#A546BE', pantone: '258C' },
		{ name: 'Purple 4', hex: '#692373', pantone: '260C' },
		{ name: 'Purple 5', hex: '#3C0046', pantone: '7449C' },
	],
	[
		{ name: 'Gray 1', hex: '#FAFAFA' },
		{ name: 'Gray 2', hex: '#EBEBEB' },
		{ name: 'Gray 3', hex: '#ACACAC' },
		{ name: 'Gray 4', hex: '#464646' },
		{ name: 'Gray 5', hex: '#151515' },
	],
]

// 최상위 섹션 그룹: 제목 + 구분선 + 데모들.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mb-20">
			<h2 className="type-title-2-emphasized mb-8 border-border border-b pb-4">{title}</h2>
			<div className="flex flex-col gap-16">{children}</div>
		</section>
	)
}

// 개별 컴포넌트 데모 라벨 + 전시.
function Demo({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h3 className="type-caption-1-emphasized mb-4 text-foreground-muted uppercase tracking-wide">
				{title}
			</h3>
			{children}
		</div>
	)
}

export default function GuidelineKitPage() {
	return (
		<article className="w-full">
			<header className="mb-12">
				<p className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
					UI Kit
				</p>
				<h1 className="type-title-1-emphasized mt-1">가이드라인 컴포넌트 키트</h1>
			</header>

			<Section title="이미지 + 텍스트">
				<Demo title="Media + Text · 워크호스">
					<MediaTextDemo />
				</Demo>

				<Demo title="Image Group · 이미지 세트(row)">
					<ImageGroupDemo />
				</Demo>

				<Demo title="Image + Text Grid">
					<ImageTextGrid
						columns={3}
						items={[
							{
								src: placeholder('로고 활용 A'),
								caption: '단색 배경 위 기본 로고 사용.',
							},
							{
								src: placeholder('로고 활용 B'),
								caption: '사진 위에는 반전 로고를 사용.',
							},
							{
								src: placeholder('로고 활용 C'),
								caption: '최소 크기 이상으로만 노출.',
							},
						]}
					/>
				</Demo>

				<Demo title="Big Image">
					<BigImage
						src={placeholder('16 : 9 Media')}
						alt="대형 미디어 예시"
						caption="풀블리드 대형 이미지 — 로고 적용, 키 비주얼 등."
					/>
				</Demo>

				<Demo title="Do / Don't">
					<DoDont
						columns={3}
						groups={[
							{
								category: 'Spacing',
								examples: [
									{
										src: placeholder('올바른 여백'),
										caption: '충분한 여백을 확보한다.',
										status: 'do',
									},
									{
										src: placeholder('좁은 여백'),
										caption: '여백을 임의로 좁히지 않는다.',
										status: 'dont',
									},
								],
							},
							{
								category: 'Color',
								examples: [
									{
										src: placeholder('권장 대비'),
										caption: '충분한 명도 대비를 사용.',
										status: 'do',
									},
									{
										src: placeholder('주의 대비'),
										caption: '경계선상의 대비는 지양.',
										status: 'ok',
									},
									{
										src: placeholder('금지 대비'),
										caption: '저대비 조합은 금지.',
										status: 'dont',
									},
								],
							},
						]}
					/>
				</Demo>
			</Section>

			<Section title="타이포그래피">
				<Demo title="Type Specimen · 라이브 입력 견본">
					<TypeSpecimen />
				</Demo>

				<Demo title="Glyph Grid · 글리프 인스펙터">
					<GlyphGrid />
				</Demo>

				<Demo title="Type Scale">
					<TypeScale
						items={[
							{
								name: 'Display',
								sample: 'Essenherb 에센허브',
								sizePx: 64,
								lineHeightPx: 72,
								weight: 700,
							},
							{
								name: 'Title 1',
								sample: 'Essenherb 에센허브',
								sizePx: 48,
								lineHeightPx: 56,
								weight: 700,
							},
							{
								name: 'Title 2',
								sample: 'Essenherb 에센허브',
								sizePx: 36,
								lineHeightPx: 44,
								weight: 600,
							},
							{
								name: 'Heading 1',
								sample: 'Essenherb 에센허브',
								sizePx: 28,
								lineHeightPx: 36,
								weight: 600,
							},
							{
								name: 'Heading 2',
								sample: 'Essenherb 에센허브',
								sizePx: 22,
								lineHeightPx: 30,
								weight: 600,
							},
							{
								name: 'Subtitle',
								sample: 'Essenherb 에센허브',
								sizePx: 18,
								lineHeightPx: 26,
								weight: 500,
							},
							{
								name: 'Body',
								sample: 'Essenherb 에센허브',
								sizePx: 16,
								lineHeightPx: 26,
								weight: 400,
							},
							{
								name: 'Callout',
								sample: 'Essenherb 에센허브',
								sizePx: 14,
								lineHeightPx: 20,
								weight: 400,
							},
							{
								name: 'Caption',
								sample: 'Essenherb 에센허브',
								sizePx: 12,
								lineHeightPx: 16,
								weight: 400,
							},
						]}
					/>
				</Demo>

				<Demo title="Signature Display · 대형 타입 시그니처">
					<SignatureDisplayDemo />
				</Demo>
			</Section>

			<Section title="컬러">
				<Demo title="Color Palette · Main (3×1)">
					<ColorPalette rows={mainColors} columns={5} />
				</Demo>

				<Demo title="Color Palette · Multi (6×5)">
					<ColorPalette rows={multiColors} columns={5} />
				</Demo>
			</Section>

			<Section title="기타">
				<Demo title="Data Table · 대량 테이블">
					<DataTableDemo />
				</Demo>

				<Demo title="Spec List · 스펙 목록">
					<SpecListDemo />
				</Demo>

				<Demo title="Spec Table">
					<SpecTable
						columns={['Breakpoint', 'Min width', 'Columns', 'Margin']}
						rows={[
							['Small', '320px', 4, '16px'],
							['Medium', '672px', 8, '16px'],
							['Large', '1056px', 16, '16px'],
							['X-Large', '1312px', 16, '24px'],
						]}
						caption="반응형 그리드 브레이크포인트 규격 예시."
					/>
				</Demo>

				<Demo title="Grid System · 레이아웃 그리드">
					<GridSystemDiagramDemo />
				</Demo>

				<Demo title="Logo Lockup · 로고 배리에이션">
					<LogoLockupDemo />
				</Demo>

				<Demo title="Rule Callout · 규정/주의 콜아웃">
					<RuleCalloutDemo />
				</Demo>

				<Demo title="Download Card · 에셋 다운로드 타일">
					<DownloadCardDemo />
				</Demo>

				<Demo title="Clear Space">
					<ClearSpace
						logoSrc={logoPlaceholder}
						alt="로고 클리어스페이스 예시"
						note="로고 주위 최소 여백은 x 이상 확보한다 (x = 심볼 높이 기준)."
					/>
				</Demo>

				<Demo title="Carousel · 캐러셀">
					<CarouselDemo />
				</Demo>
			</Section>
		</article>
	)
}
