import { BigImage } from '@/features/guideline/components/kit/big-image'
import { ClearSpace } from '@/features/guideline/components/kit/clear-space'
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

			<Demo title="Type Scale">
				<TypeScale
					items={[
						{ name: 'Display', sample: 'Aa 브랜드', sizePx: 48, lineHeightPx: 56, weight: 700 },
						{ name: 'Heading 1', sample: 'Aa 브랜드', sizePx: 32, lineHeightPx: 40, weight: 600 },
						{ name: 'Heading 2', sample: 'Aa 브랜드', sizePx: 24, lineHeightPx: 32, weight: 600 },
						{ name: 'Body', sample: 'Aa 브랜드 가나다 ABCabc', sizePx: 16, lineHeightPx: 26, weight: 400 },
						{ name: 'Caption', sample: 'Aa 브랜드 가나다 ABCabc', sizePx: 13, lineHeightPx: 18, weight: 400 },
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
