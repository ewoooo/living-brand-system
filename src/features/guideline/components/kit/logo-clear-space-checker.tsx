'use client'

import { useState } from 'react'

/**
 * 로고 클리어스페이스 체커 — 로고 이미지/SVG 위에 최소 여백(clear space) 가이드를 on/off 토글로 겹쳐,
 * 로고 주변에 확보해야 할 여백을 눈으로 테스트하는 프로토타입. 브랜드 무관: 로고·단위 라벨 전부 props.
 * 점선 경계 = 최소 여백 한계, 로고와 경계 사이 간격 = 단위(x).
 *
 * @example
 * <LogoClearSpaceChecker logo={url} unitLabel="x" />
 */
export function LogoClearSpaceChecker({
	logo,
	/** 여백 단위 라벨. 기본 'x'. */
	unitLabel = 'x',
}: {
	logo: string
	unitLabel?: string
}) {
	const [show, setShow] = useState(true)

	return (
		<div className="w-full">
			<button
				type="button"
				onClick={() => setShow((s) => !s)}
				aria-pressed={show}
				className="mb-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
			>
				<span
					className={`h-2.5 w-2.5 rounded-full ${show ? 'bg-foreground' : 'bg-border'}`}
				/>
				여백 가이드 {show ? '켜짐' : '꺼짐'}
			</button>
			<div className="grid place-items-center rounded-lg border border-border bg-fill-muted p-10 sm:p-16">
				{/* 클리어스페이스 경계(점선). 안쪽 padding이 곧 최소 여백. */}
				<div
					className={`relative p-10 transition-colors sm:p-14 ${
						show ? 'border border-scrim/50 border-dashed' : ''
					}`}
				>
					{show && (
						<>
							<span className="-top-5 -translate-x-1/2 absolute left-1/2 font-body text-muted-foreground text-xs">
								{unitLabel}
							</span>
							<span className="-left-5 -translate-y-1/2 absolute top-1/2 font-body text-muted-foreground text-xs">
								{unitLabel}
							</span>
						</>
					)}
					{/* biome-ignore lint/performance/noImgElement: 자체완결 data-URI라 next/image 미사용. */}
					<img src={logo} alt="로고" className="h-12 w-auto sm:h-16" />
				</div>
			</div>
			<p className="mt-2 font-body font-normal text-muted-foreground text-xs">
				점선 = 확보해야 할 최소 여백({unitLabel}). 로고와 다른 요소 사이에 이만큼을
				비워둡니다.
			</p>
		</div>
	)
}

// 프로토타입용 mock 로고(브랜드 무관 워드마크).
const wordmark = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56"><text x="120" y="40" font-family="sans-serif" font-size="34" font-weight="800" letter-spacing="-1" fill="#1f6f5c" text-anchor="middle">Essenherb</text></svg>`,
)}`

export function LogoClearSpaceCheckerDemo() {
	return <LogoClearSpaceChecker logo={wordmark} unitLabel="x" />
}
