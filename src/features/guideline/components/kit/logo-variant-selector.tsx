'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

/**
 * 로고 배리언트 셀렉터 — cash.app/logo의 Logo variant Selector 구조를 차용.
 * 큰 프리뷰 스테이지 + 로고 변형 선택 + 배경 선택 + 다운로드. 선택하면 프리뷰가 즉시 갱신된다.
 * 브랜드 무관: 로고/배경은 전부 props(data-URI·hex)로 주입.
 *
 * @example
 * <LogoVariantSelector logos={[{ id, label, logo }]} backgrounds={[{ id, label, color }]} />
 */
export type LogoOption = { id: string; label: string; logo: string }
export type BackgroundOption = { id: string; label: string; color: string }

export function LogoVariantSelector({
	logos,
	backgrounds,
}: {
	logos: LogoOption[]
	backgrounds: BackgroundOption[]
}) {
	const [logoId, setLogoId] = useState(logos[0]?.id)
	const [bgId, setBgId] = useState(backgrounds[0]?.id)
	const logo = logos.find((l) => l.id === logoId) ?? logos[0]
	const bg = backgrounds.find((b) => b.id === bgId) ?? backgrounds[0]

	return (
		<div className="grid gap-6 md:grid-cols-[1fr_16rem]">
			{/* 프리뷰 스테이지 */}
			<div
				className="grid min-h-72 place-items-center rounded-lg border border-border p-10 transition-colors"
				style={{ backgroundColor: bg?.color }}
			>
				{/* biome-ignore lint/performance/noImgElement: 자체완결 data-URI라 next/image 미사용. */}
				<img src={logo?.logo} alt={logo?.label} className="h-16 w-auto md:h-20" />
			</div>

			{/* 컨트롤 패널 */}
			<div className="flex flex-col gap-6">
				<Control label="로고">
					<div className="flex flex-wrap gap-2">
						{logos.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setLogoId(option.id)}
								aria-pressed={option.id === logoId}
								className={`rounded-md border px-3 py-1.5 font-body text-sm transition-colors ${
									option.id === logoId
										? 'border-foreground bg-foreground text-background'
										: 'border-border text-foreground hover:bg-fill-hover'
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</Control>

				<Control label="배경">
					<div className="flex flex-wrap gap-2">
						{backgrounds.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => setBgId(option.id)}
								aria-label={option.label}
								aria-pressed={option.id === bgId}
								title={option.label}
								className={`h-8 w-8 rounded-full border transition-all ${
									option.id === bgId
										? 'border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background'
										: 'border-border'
								}`}
								style={{ backgroundColor: option.color }}
							/>
						))}
					</div>
				</Control>

				<a
					href={logo?.logo}
					download={`${logo?.label ?? 'logo'}.svg`}
					className="mt-auto inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 font-body font-medium text-background text-sm"
				>
					SVG 다운로드
				</a>
			</div>
		</div>
	)
}

function Control({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<p className="mb-2 font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</p>
			{children}
		</div>
	)
}

// 프로토타입용 mock 로고/배경(브랜드 무관).
const wordmark = (fg: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56"><text x="120" y="40" font-family="sans-serif" font-size="34" font-weight="800" letter-spacing="-1" fill="${fg}" text-anchor="middle">Essenherb</text></svg>`,
	)}`
const mark = (fg: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke="${fg}" stroke-width="6"/><path d="M22 38 l10 10 l18 -24" fill="none" stroke="${fg}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
	)}`

export function LogoVariantSelectorDemo() {
	return (
		<LogoVariantSelector
			logos={[
				{ id: 'wordmark-dark', label: '워드마크 (Dark)', logo: wordmark('#171717') },
				{ id: 'wordmark-light', label: '워드마크 (Light)', logo: wordmark('#ffffff') },
				{ id: 'mark-dark', label: '심볼 (Dark)', logo: mark('#171717') },
				{ id: 'mark-light', label: '심볼 (Light)', logo: mark('#ffffff') },
			]}
			backgrounds={[
				{ id: 'white', label: 'White', color: '#ffffff' },
				{ id: 'sand', label: 'Sand', color: '#e7e2d6' },
				{ id: 'green', label: 'Brand Green', color: '#1f6f5c' },
				{ id: 'ink', label: 'Ink', color: '#171717' },
			]}
		/>
	)
}
