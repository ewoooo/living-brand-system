'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'

/**
 * 로고 클리어스페이스 = N·A. A(unit) = 워드마크의 수직 줄기 두께.
 *
 * 측정과 렌더를 분리했다:
 *  - LogoStemMeasure: admin authoring에서 줄기를 클릭해 A를 **로고 폭 대비 비율**(0~1)로 산출한다.
 *    비율로 저장하므로 해상도·표시 크기와 무관하다(1회 authoring, 이후 재측정 불필요).
 *  - LogoClearSpaceViewer: 저장된 stemRatio로 클리어스페이스를 그린다. 측정 로직 없이
 *    로고 크기 조절·가이드 토글만 제공한다. A = stemRatio × 표시폭이라 크기를 바꿔도 여백이 비례한다.
 *
 * 브랜드 무관: 로고(url)·비율·배수·틴트 전부 데이터로 주입.
 */

// same-origin 에셋이라 canvas 픽셀 읽기가 막히지 않는다. SVG는 viewBox 기준 자연 크기로 래스터화된다.
// 비율(폭÷스캔폭)은 스캔 해상도에 불변이므로 스캔 크기는 아무거나 충분히 크면 된다.
function rasterize(logo: string, onReady: (px: Uint8ClampedArray, w: number, h: number) => void) {
	const img = new Image()
	img.crossOrigin = 'anonymous'
	img.onload = () => {
		const w = img.naturalWidth || 1000
		const h = img.naturalHeight || Math.round(w / 4.8)
		const c = document.createElement('canvas')
		c.width = w
		c.height = h
		const ctx = c.getContext('2d')
		if (!ctx) return
		ctx.drawImage(img, 0, 0, w, h)
		try {
			onReady(ctx.getImageData(0, 0, w, h).data, w, h)
		} catch {
			/* cross-origin 오염 등 — 측정 불가, 폴백 비율 사용 */
		}
	}
	img.src = logo
}

/**
 * 줄기 측정 위젯 — admin 필드의 코어. 로고 위 한 점을 클릭하면 그 가로 스캔라인에서
 * 잉크(불투명 픽셀) 연속 구간의 폭을 재 stemRatio(폭÷로고폭)로 onChange 한다.
 */
export function LogoStemMeasure({
	logo,
	value,
	onChange,
}: {
	logo: string
	/** 저장된 stemRatio(0~1) 또는 null(미측정). */
	value: number | null
	onChange: (ratio: number) => void
}) {
	const pixels = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		setReady(false)
		pixels.current = null
		rasterize(logo, (data, w, h) => {
			pixels.current = { data, w, h }
			setReady(true)
		})
	}, [logo])

	function measureAt(event: ReactPointerEvent<HTMLButtonElement>) {
		const p = pixels.current
		if (!p) return
		const rect = event.currentTarget.getBoundingClientRect()
		const x = Math.round(((event.clientX - rect.left) / rect.width) * p.w)
		const y = Math.round(((event.clientY - rect.top) / rect.height) * p.h)
		if (x < 0 || x >= p.w || y < 0 || y >= p.h) return
		const ink = (px: number) => p.data[(y * p.w + px) * 4 + 3] > 40
		if (!ink(x)) return // 빈 곳 클릭 — 무시
		let left = x
		let right = x
		while (left - 1 >= 0 && ink(left - 1)) left--
		while (right + 1 < p.w && ink(right + 1)) right++
		onChange(Math.max(2, right - left + 1) / p.w)
	}

	return (
		<div className="w-full">
			{/* 프레임/패딩은 바깥 div가 갖고, 클릭 버튼은 이미지를 딱 감싼다.
			    measureAt이 버튼 rect를 로고 픽셀에 매핑하므로 버튼 박스 == 이미지 박스여야 한다. */}
			<div className="grid min-h-40 w-full place-items-center overflow-x-auto rounded-lg border border-border bg-background p-8">
				<button
					type="button"
					onClick={measureAt}
					disabled={!ready}
					title="세로 줄기를 클릭해 A를 실측"
					className="inline-block cursor-crosshair p-0 leading-none disabled:cursor-wait"
				>
					{/* biome-ignore lint/performance/noImgElement: 원격 svg라 next/image 대신 img 사용. */}
					<img src={logo} alt="로고" className="pointer-events-none block h-16 w-auto" />
				</button>
			</div>
			<p className="mt-2 font-body text-muted-foreground text-xs">
				로고의 <b>수직 줄기</b>를 클릭하면 A를 실측합니다. 현재 A ={' '}
				<b className="tabular-nums">
					{value == null ? '미측정' : `로고폭의 ${(value * 100).toFixed(1)}%`}
				</b>
			</p>
		</div>
	)
}

/**
 * 클리어스페이스 뷰어 — 저장된 stemRatio로 로고 주위 N·A 여백을 그린다.
 * 로고 크기 슬라이더로 표시 폭을 바꿔도 A = stemRatio × 폭이라 여백이 비례해 따라온다.
 */
export function LogoClearSpaceViewer({
	logo,
	stemRatio,
	multiplier = 3,
	tint = '120 120 120',
	fallbackAspect = 891 / 185,
}: {
	logo: string
	/** 로고 폭 대비 A 비율(0~1). admin에서 측정·저장된 값. */
	stemRatio: number
	/** 여백 배수 N(N·A). */
	multiplier?: number
	/** 틴트 색 "r g b". */
	tint?: string
	/** 로고 종횡비 폴백(로드 전). */
	fallbackAspect?: number
}) {
	const [n, setN] = useState(multiplier)
	const [show, setShow] = useState(true)
	const [width, setWidth] = useState(360)
	const [aspect, setAspect] = useState(fallbackAspect)

	useEffect(() => {
		const img = new Image()
		img.onload = () => {
			if (img.naturalWidth && img.naturalHeight)
				setAspect(img.naturalWidth / img.naturalHeight)
		}
		img.src = logo
	}, [logo])

	const logoW = width
	const logoH = width / aspect
	const a = stemRatio * logoW
	const margin = n * a
	const outerW = logoW + margin * 2
	const outerH = logoH + margin * 2
	const color = `rgb(${tint})`
	// A 기준 사각형 — stem 위치는 저장하지 않으므로 로고 중앙에 폭 A로 표시(단위 크기 예시).
	const aLeft = margin + (logoW - a) / 2

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
						className="w-32 accent-foreground"
						aria-label="클리어스페이스 배수 (N·A)"
					/>
					<span className="w-8 font-semibold tabular-nums" style={{ color }}>
						{n}A
					</span>
				</label>
				<label className="flex items-center gap-3 font-body text-sm">
					<span className="text-muted-foreground">로고 크기</span>
					<input
						type="range"
						min={120}
						max={640}
						step={10}
						value={width}
						onChange={(e) => setWidth(Number(e.target.value))}
						className="w-40 accent-foreground"
						aria-label="로고 표시 폭"
					/>
					<span className="w-12 font-semibold tabular-nums">{width}px</span>
				</label>
			</div>

			<div className="w-full overflow-auto">
				<div className="grid min-h-56 place-items-center rounded-lg border border-border bg-background p-8">
					<div className="relative shrink-0" style={{ width: outerW, height: outerH }}>
						{/* 4개 padding 사각형 — 그룹 opacity로 코너에서 겹쳐도 색이 진해지지 않는다. */}
						{show && (
							<div className="absolute inset-0" style={{ opacity: 0.14 }}>
								<div
									className="absolute top-0 right-0 left-0"
									style={{ height: margin, background: color }}
								/>
								<div
									className="absolute right-0 bottom-0 left-0"
									style={{ height: margin, background: color }}
								/>
								<div
									className="absolute top-0 bottom-0 left-0"
									style={{ width: margin, background: color }}
								/>
								<div
									className="absolute top-0 right-0 bottom-0"
									style={{ width: margin, background: color }}
								/>
							</div>
						)}

						{show && (
							<>
								{/* 코너 NA 라벨 */}
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
											color,
										}}
									>
										{n}A
									</span>
								))}

								{/* A 기준 사각형(폭=A, 높이=전체) — 단위 크기를 보여준다. */}
								<div
									className="absolute top-0 z-10"
									style={{
										left: aLeft,
										width: a,
										height: outerH,
										border: `1px solid ${color}`,
									}}
								/>
								<span
									className="absolute top-1 z-10 -translate-x-1/2 px-1 font-body font-semibold text-xs leading-none"
									style={{
										left: aLeft + a / 2,
										color,
										background: 'var(--background)',
									}}
								>
									A
								</span>
							</>
						)}

						{/* 로고 */}
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
							{/* biome-ignore lint/performance/noImgElement: 원격 svg라 next/image 미사용. */}
							<img src={logo} alt="로고" className="size-full object-contain" />
						</div>
					</div>
				</div>
			</div>

			<p className="mt-3 font-body text-muted-foreground text-xs">
				최소 여백 = <b style={{ color }}>{n}A</b>. 단위 <b>A</b>는 워드마크의 수직 줄기
				두께이며, 로고 폭의 <b className="tabular-nums">{(stemRatio * 100).toFixed(1)}%</b>
				로 저장돼 크기를 바꿔도 여백이 비례합니다.
			</p>
		</div>
	)
}

// 실제 essenherb 로고(S3 brand-logos, Payload 서빙). viewBox 891×185.
const essenherbLogo = '/api/brand-logos/file/logo_main_horizontal.svg'

// 측정 → 뷰어 흐름 데모. admin에서 측정한 stemRatio가 뷰어로 전달되는 구조를 kit에서 확인한다.
export function LogoClearSpaceUnitDemo() {
	const [ratio, setRatio] = useState(12 / 360) // 폴백: 기존 kit 값(A=12px @ 폭360)

	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="mb-2 font-body font-semibold text-sm">1. 측정 (admin authoring)</p>
				<LogoStemMeasure logo={essenherbLogo} value={ratio} onChange={setRatio} />
			</div>
			<div>
				<p className="mb-2 font-body font-semibold text-sm">2. 뷰어 (발행 화면)</p>
				<LogoClearSpaceViewer
					logo={essenherbLogo}
					stemRatio={ratio}
					multiplier={3}
					tint="234 83 67"
				/>
			</div>
		</div>
	)
}
