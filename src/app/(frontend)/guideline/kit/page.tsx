import { BigImage } from '@/features/guideline/components/kit/big-image'
import { ClearSpace } from '@/features/guideline/components/kit/clear-space'
import { ColorPalette } from '@/features/guideline/components/kit/color-palette'
import { SpecTable } from '@/features/guideline/components/kit/spec-table'
import { TypeScale } from '@/features/guideline/components/kit/type-scale'

// UI 키트 갤러리(중간공유용). 데이터 비연결 — mock으로 컴포넌트만 전시한다.
// nav 미연결. 나중에 각 컴포넌트를 Payload 블록 렌더러에 어댑터로 연결한다.

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

function Demo({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mb-16">
			<h2 className="type-caption-1-emphasized mb-4 text-foreground-muted uppercase tracking-wide">
				{title}
			</h2>
			{children}
		</section>
	)
}

export default function GuidelineKitPage() {
	return (
		<article className="w-full">
			<header className="mb-12">
				<p className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
					UI Kit
				</p>
				<h1 className="type-title-2-emphasized mt-1">가이드라인 컴포넌트 키트</h1>
			</header>

			<Demo title="Color Palette · Main (3×1)">
				<ColorPalette rows={mainColors} columns={5} />
			</Demo>

			<Demo title="Color Palette · Multi (6×5)">
				<ColorPalette rows={multiColors} columns={5} />
			</Demo>

			<Demo title="Type Scale">
				<TypeScale
					items={[
						{
							name: 'Display',
							sample: 'Aa 브랜드',
							sizePx: 48,
							lineHeightPx: 56,
							weight: 700,
						},
						{
							name: 'Heading 1',
							sample: 'Aa 브랜드',
							sizePx: 32,
							lineHeightPx: 40,
							weight: 600,
						},
						{
							name: 'Heading 2',
							sample: 'Aa 브랜드',
							sizePx: 24,
							lineHeightPx: 32,
							weight: 600,
						},
						{
							name: 'Body',
							sample: 'Aa 브랜드 가나다 ABCabc',
							sizePx: 16,
							lineHeightPx: 26,
							weight: 400,
						},
						{
							name: 'Caption',
							sample: 'Aa 브랜드 가나다 ABCabc',
							sizePx: 13,
							lineHeightPx: 18,
							weight: 400,
						},
					]}
				/>
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

			<Demo title="Big Image">
				<BigImage
					src={placeholder('16 : 9 Media')}
					alt="대형 미디어 예시"
					caption="풀블리드 대형 이미지 — 로고 적용, 키 비주얼 등."
				/>
			</Demo>

			<Demo title="Clear Space">
				<ClearSpace
					logoSrc={logoPlaceholder}
					alt="로고 클리어스페이스 예시"
					note="로고 주위 최소 여백은 x 이상 확보한다 (x = 심볼 높이 기준)."
				/>
			</Demo>
		</article>
	)
}
