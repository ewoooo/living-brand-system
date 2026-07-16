import type { ReactNode } from 'react'

// 로고 배리에이션 전시: 배경별(라이트/다크/브랜드) 타일 위에 정·반전·단색 로고를 올린다.
// 카본 매핑: 각 타일 = $layer 타일(rounded-lg border), 라벨은 caption. 정/반전 개념을 배경 대비로 보여주는 조각.

export type LogoVariant = {
	label: string
	// svg data-URI 문자열 또는 직접 렌더할 노드.
	logo: string | ReactNode
	background: 'light' | 'dark' | 'brand'
	// background === 'brand'일 때만 사용하는 브랜드 강조색 hex(데이터로 주입, 컴포넌트는 브랜드 무관).
	color?: string
}

// 배경 종류 → 타일 표면. light/dark는 시맨틱 토큰, brand는 주입된 hex.
const tileClass: Record<LogoVariant['background'], string> = {
	light: 'bg-fill-muted',
	dark: 'bg-background',
	brand: '',
}

export function LogoLockup({ variants }: { variants: LogoVariant[] }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
			{variants.map((variant) => (
				<figure
					key={variant.label}
					className="m-0 overflow-hidden rounded-lg bg-background-secondary"
				>
					<div
						className={`grid min-h-40 place-items-center p-6 ${tileClass[variant.background]}`}
						style={
							variant.background === 'brand'
								? { backgroundColor: variant.color }
								: undefined
						}
					>
						{typeof variant.logo === 'string' ? (
							// biome-ignore lint/performance/noImgElement: 자체완결 data-URI라 next/image 미사용.
							<img src={variant.logo} alt={variant.label} className="h-9 w-auto" />
						) : (
							variant.logo
						)}
					</div>
					<figcaption className="type-caption-1 px-4 py-3 text-foreground-muted">
						{variant.label}
					</figcaption>
				</figure>
			))}
		</div>
	)
}

// mock 워드마크 로고: 'Essenherb'를 심볼처럼. fg=글자색, bg=배경(투명이면 타일색이 비침).
const wordmark = (fg: string, bg = 'none') =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48"><rect width="200" height="48" fill="${bg}"/><text x="100" y="33" font-family="sans-serif" font-size="26" font-weight="700" letter-spacing="-1" fill="${fg}" text-anchor="middle">Essenherb</text></svg>`,
	)}`

export function LogoLockupDemo() {
	return (
		<LogoLockup
			variants={[
				{ label: 'Positive · 라이트 배경', logo: wordmark('#171717'), background: 'light' },
				{ label: 'Reversed · 다크 배경', logo: wordmark('#ffffff'), background: 'dark' },
				{
					label: 'Mono · 브랜드 레드',
					logo: wordmark('#ffffff'),
					background: 'brand',
					color: '#EA5343',
				},
			]}
		/>
	)
}
