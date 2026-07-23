'use client'

import { useState } from 'react'

// 같은 크기 SVG 3장을 절대 겹침으로 정렬해 보여주는 naive 뷰어. 기본 로고는 항상 표시,
// 등록상표®·클리어스페이스 오버레이는 토글. 같은 사이즈라 inset-0 + w-full이면 자동 정렬된다.
export function LogoViewer({
	logo,
	registeredMark,
	clearSpaceGuide,
}: {
	logo: string
	registeredMark?: string | null
	clearSpaceGuide?: string | null
}) {
	const [showMark, setShowMark] = useState(false)
	const [showGuide, setShowGuide] = useState(true)

	return (
		<div className="w-full">
			{(registeredMark || clearSpaceGuide) && (
				<div className="mb-4 flex flex-wrap gap-2">
					{registeredMark && (
						<Toggle on={showMark} onClick={() => setShowMark((s) => !s)}>
							등록상표 ®
						</Toggle>
					)}
					{clearSpaceGuide && (
						<Toggle on={showGuide} onClick={() => setShowGuide((s) => !s)}>
							여백 가이드
						</Toggle>
					)}
				</div>
			)}

			<div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8">
				<div className="relative w-full max-w-md">
					{/* biome-ignore lint/performance/noImgElement: 원격 svg라 next/image 미사용. */}
					<img src={logo} alt="로고" className="block w-full" />
					{registeredMark && showMark && (
						// biome-ignore lint/performance/noImgElement: 오버레이 svg라 next/image 미사용.
						<img
							src={registeredMark}
							alt=""
							className="pointer-events-none absolute inset-0 w-full"
						/>
					)}
					{clearSpaceGuide && showGuide && (
						// biome-ignore lint/performance/noImgElement: 오버레이 svg라 next/image 미사용.
						<img
							src={clearSpaceGuide}
							alt=""
							className="pointer-events-none absolute inset-0 w-full"
						/>
					)}
				</div>
			</div>
		</div>
	)
}

function Toggle({
	on,
	onClick,
	children,
}: {
	on: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={on}
			className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
		>
			<span className={`h-2.5 w-2.5 rounded-full ${on ? 'bg-foreground' : 'bg-border'}`} />
			{children}
		</button>
	)
}
