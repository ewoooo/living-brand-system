'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'

/**
 * 로고 클리어스페이스(A 단위) — 브랜딩 팀 공통 패턴을 그대로 옮긴 컴포넌트.
 * 최소 여백을 로고에서 파생된 단위 **A**의 배수(N·A)로 정의한다. A는 워드마크의 수직 줄기 두께다.
 *
 * A 실측(핵심): 로고의 세로 줄기를 클릭하면 로고 SVG를 canvas에 그려 그 지점 가로 스캔라인에서
 * 잉크(불투명 픽셀) 연속 구간의 폭을 재 A로 쓴다 — 사람 눈대중이 아니라 로고 자체에서 A를 뽑아낸다.
 * (same-origin 에셋이라 canvas 픽셀 읽기가 막히지 않는다.)
 *
 * 렌더 모델:
 * - 상/우/하/좌 4개 padding을 각각 직사각형으로 그린다. 코너에서 겹쳐도 색이 진해지지 않게
 *   그룹 opacity로 처리한다(불투명 단색 4개 + 컨테이너 opacity).
 * - 기준점 A는 세로 border-only 사각형(폭=A, 높이=전체 영역)으로, 좌·우 padding 등 모든
 *   세로 사각형과 높이가 같다.
 *
 * 브랜드 무관: 로고(svg URL)·초기 A·배수·틴트 색 전부 props.
 *
 * @example
 * <LogoClearSpaceUnit logo={s3Url} logoW={360} logoH={75} unit={12} multiplier={3} tint="234 83 67" />
 */
export function LogoClearSpaceUnit({
	logo,
	/** 표시할 로고 폭·높이(px). */
	logoW,
	logoH,
	/** A 초기값(px). 줄기 클릭 실측 전까지 쓰는 폴백. */
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
	// 실측된 줄기 구간(로고 로컬 px). left=줄기 왼쪽, width=A. null이면 미측정.
	const [seg, setSeg] = useState<{ left: number; width: number } | null>(null)
	// 로고 픽셀(logoW×logoH) — 줄기 실측용.
	const pixels = useRef<Uint8ClampedArray | null>(null)

	useEffect(() => {
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			const c = document.createElement('canvas')
			c.width = logoW
			c.height = logoH
			const ctx = c.getContext('2d')
			if (!ctx) return
			ctx.drawImage(img, 0, 0, logoW, logoH)
			try {
				pixels.current = ctx.getImageData(0, 0, logoW, logoH).data
			} catch {
				pixels.current = null
			}
		}
		img.src = logo
	}, [logo, logoW, logoH])

	// 클릭 지점의 세로 줄기 두께를 픽셀 스캔으로 잰다.
	function measureAt(event: ReactPointerEvent<HTMLButtonElement>) {
		const data = pixels.current
		if (!data) return
		const rect = event.currentTarget.getBoundingClientRect()
		const x = Math.round(((event.clientX - rect.left) / rect.width) * logoW)
		const y = Math.round(((event.clientY - rect.top) / rect.height) * logoH)
		if (x < 0 || x >= logoW || y < 0 || y >= logoH) return
		const ink = (px: number) => data[(y * logoW + px) * 4 + 3] > 40
		if (!ink(x)) return // 빈 곳 클릭 — 무시
		let left = x
		let right = x
		while (left - 1 >= 0 && ink(left - 1)) left--
		while (right + 1 < logoW && ink(right + 1)) right++
		setSeg({ left, width: Math.max(2, right - left + 1) })
	}

	const a = seg?.width ?? unit
	const margin = n * a
	const outerW = logoW + margin * 2
	const outerH = logoH + margin * 2
	const label = `rgb(${tint})`
	const solid = `rgb(${tint})`
	// A 사각형 x — 측정했으면 그 줄기 위치, 아니면 로고 중앙(기본 미리보기).
	const aLeft = seg ? margin + seg.left : margin + (logoW - a) / 2

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
				<span className="font-body text-sm">
					<span className="text-muted-foreground">A = </span>
					<b className="tabular-nums" style={{ color: label }}>
						{Math.round(a)}px
					</b>
					{seg != null && (
						<button
							type="button"
							onClick={() => setSeg(null)}
							className="ml-2 rounded border border-border px-1.5 py-0.5 text-muted-foreground text-xs hover:bg-fill-hover"
						>
							초기화
						</button>
					)}
				</span>
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

								{/* 기준점 A — 세로 border-only 사각형. 측정한 줄기 위치(aLeft)에 폭 A로 붙고,
								    높이는 전체 영역(outerH) = 다른 세로 사각형과 동일. */}
								<div
									className="absolute top-0 z-10"
									style={{
										left: aLeft,
										width: a,
										height: outerH,
										border: `1px solid ${label}`,
									}}
								/>
								<span
									className="absolute top-1 z-10 -translate-x-1/2 px-1 font-body font-semibold text-xs leading-none"
									style={{
										left: aLeft + a / 2,
										color: label,
										background: 'var(--background)',
									}}
								>
									A
								</span>
							</>
						)}

						{/* 로고 박스 — 클릭하면 줄기 두께를 실측해 A로 쓴다. */}
						<button
							type="button"
							onClick={measureAt}
							title="세로 줄기를 클릭해 A를 실측"
							className="absolute cursor-crosshair bg-background p-0"
							style={{
								top: margin,
								left: margin,
								width: logoW,
								height: logoH,
								outline: show ? `1px dashed rgb(${tint} / 0.55)` : 'none',
							}}
						>
							{/* biome-ignore lint/performance/noImgElement: S3 원격 svg라 next/image 대신 img 사용. */}
							<img
								src={logo}
								alt="로고"
								className="pointer-events-none size-full object-contain"
							/>
						</button>
					</div>
				</div>
			</div>

			<p className="mt-3 font-body text-muted-foreground text-xs">
				최소 여백 = <b style={{ color: label }}>{n}A</b>. 단위 <b>A</b>(세로 border
				사각형)는 워드마크의 <b>수직 줄기 두께</b>다 — 로고의 줄기를 클릭하면 픽셀 스캔으로
				실측한다. 상·우·하·좌 4개 padding은 각각 사각형이며 겹치는 코너에서도 색이 진해지지
				않는다.
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
			unit={12}
			multiplier={3}
			tint="234 83 67"
		/>
	)
}
