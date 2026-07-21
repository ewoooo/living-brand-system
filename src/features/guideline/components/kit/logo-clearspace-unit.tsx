'use client'

import { useState } from 'react'

/**
 * 로고 클리어스페이스(A 단위) — 브랜딩 팀 공통 패턴을 그대로 옮긴 컴포넌트.
 * 최소 여백을 로고에서 파생된 단위 **A**의 배수(N·A)로 정의한다. A는 워드마크의 수직 줄기에서
 * 딴다(예: Essenherb는 'h', Pledis는 'd'의 수직 줄기). 여백이 A에 비례하므로 로고를 키우거나
 * 줄여도 클리어스페이스가 항상 같은 비율로 따라온다 — 그 "A에 상대적"이라는 규칙을 N 슬라이더로
 * 라이브로 늘였다 줄이며 검증하는 게 종이 대비 웹의 이점.
 *
 * 렌더 모델:
 * - 상/우/하/좌 4개 padding을 각각 직사각형으로 그린다.
 * - 코너에서 겹쳐도 색이 진해지지 않게 그룹 opacity로 처리한다(불투명 단색 사각형 4개 + 컨테이너 opacity).
 * - 기준점(수직 줄기 = A)은 세로 형태의 border-only 사각형으로 표시한다.
 *
 * 브랜드 무관: 로고(svg URL)·단위(A)·배수·틴트 색 전부 props.
 *
 * @example
 * <LogoClearSpaceUnit logo={s3Url} logoW={320} logoH={96} unit={22} multiplier={3} tint="234 83 67" />
 */
export function LogoClearSpaceUnit({
	logo,
	/** 표시할 로고 폭·높이(px). */
	logoW,
	logoH,
	/** 단위 A의 크기(px, 표시 로고 기준). 수직 줄기에서 딴 값. */
	unit,
	/** 여백 배수 N(N·A). 슬라이더 초기값. */
	multiplier = 2,
	/** 틴트 색 "r g b". padding 사각형·라벨·기준 사각형에 쓴다. */
	tint = '120 120 120',
}: {
	logo: string
	logoW: number
	logoH: number
	unit: number
	multiplier?: number
	tint?: string
}) {
	const [n, setN] = useState(multiplier)
	const [show, setShow] = useState(true)

	const margin = n * unit
	const outerW = logoW + margin * 2
	const outerH = logoH + margin * 2
	const label = `rgb(${tint})`
	const solid = `rgb(${tint})`

	// A 기준 사각형(세로 형태, border-only) 치수 — 폭은 줄기 두께 느낌으로 A의 일부.
	const refW = Math.max(6, Math.round(unit * 0.32))

	return (
		<div className="w-full">
			<div className="mb-4 flex flex-wrap items-center gap-5">
				<button
					type="button"
					onClick={() => setShow((s) => !s)}
					aria-pressed={show}
					className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
				>
					<span
						className={`h-2.5 w-2.5 rounded-full ${show ? 'bg-foreground' : 'bg-border'}`}
					/>
					가이드 {show ? '켜짐' : '꺼짐'}
				</button>
				<label className="flex items-center gap-3 font-body text-sm">
					<span className="text-muted-foreground">여백</span>
					<input
						type="range"
						min={1}
						max={4}
						step={1}
						value={n}
						onChange={(e) => setN(Number(e.target.value))}
						className="w-40 accent-foreground"
						aria-label="클리어스페이스 배수 (N·A)"
					/>
					<span className="w-8 font-semibold tabular-nums" style={{ color: label }}>
						{n}A
					</span>
				</label>
			</div>

			<div className="w-full overflow-x-auto">
				<div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8">
					<div className="relative shrink-0" style={{ width: outerW, height: outerH }}>
						{/* 4개 padding 사각형 — 그룹 opacity로 겹쳐도 색이 진해지지 않음(불투명 단색). */}
						{show && (
							<div className="absolute inset-0" style={{ opacity: 0.14 }}>
								<div
									className="absolute top-0 right-0 left-0"
									style={{ height: margin, background: solid }}
								/>
								<div
									className="absolute right-0 bottom-0 left-0"
									style={{ height: margin, background: solid }}
								/>
								<div
									className="absolute top-0 bottom-0 left-0"
									style={{ width: margin, background: solid }}
								/>
								<div
									className="absolute top-0 right-0 bottom-0"
									style={{ width: margin, background: solid }}
								/>
							</div>
						)}

						{show && (
							<>
								{/* 코너 NA 라벨(full opacity) */}
								{(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
									<span
										key={pos}
										className="absolute grid font-body font-medium text-xs"
										style={{
											width: margin,
											height: margin,
											placeItems: 'center',
											top: pos[0] === 't' ? 0 : undefined,
											bottom: pos[0] === 'b' ? 0 : undefined,
											left: pos[1] === 'l' ? 0 : undefined,
											right: pos[1] === 'r' ? 0 : undefined,
											color: label,
										}}
									>
										{n}A
									</span>
								))}

								{/* 기준점 A — 세로 형태, border-only 사각형. 상단 여백 중앙. */}
								<div
									className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
									style={{ top: Math.max(2, (margin - unit) / 2 - 16) }}
								>
									<span
										className="font-body font-semibold text-xs leading-none"
										style={{ color: label }}
									>
										A
									</span>
									<div
										style={{
											width: refW,
											height: unit,
											border: `1px solid ${label}`,
										}}
									/>
								</div>
							</>
						)}

						{/* 로고 박스 */}
						<div
							className="absolute bg-background"
							style={{
								top: margin,
								left: margin,
								width: logoW,
								height: logoH,
								outline: show ? `1px dashed rgb(${tint} / 0.55)` : 'none',
							}}
						>
							{/* biome-ignore lint/performance/noImgElement: S3 원격 svg라 next/image 대신 img 사용. */}
							<img src={logo} alt="로고" className="size-full object-contain" />
						</div>
					</div>
				</div>
			</div>

			<p className="mt-3 font-body text-muted-foreground text-xs">
				최소 여백 = <b style={{ color: label }}>{n}A</b>. 단위 <b>A</b>(세로 border
				사각형)는 워드마크의 수직 줄기에서 딴다(Essenherb=h, Pledis=d). 상·우·하·좌 4개
				padding은 각각 사각형이며, 겹치는 코너에서도 색이 진해지지 않는다.
			</p>
		</div>
	)
}

// 실제 essenherb 로고(S3 brand-logos 컬렉션, Payload가 서빙). viewBox 891×185 → 표시 비율 유지.
const essenherbLogo = '/api/brand-logos/file/logo_main_horizontal.svg'

export function LogoClearSpaceUnitDemo() {
	return (
		<LogoClearSpaceUnit
			logo={essenherbLogo}
			logoW={360}
			logoH={75}
			unit={20}
			multiplier={3}
			tint="234 83 67"
		/>
	)
}
