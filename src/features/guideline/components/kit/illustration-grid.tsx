'use client'

import { useMemo, useState } from 'react'
import i1 from './svg/1.svg'
import i2 from './svg/2.svg'
import i3 from './svg/3.svg'
import i4 from './svg/4.svg'
import i5 from './svg/5.svg'
import i6 from './svg/6.svg'
import i7 from './svg/7.svg'
import i8 from './svg/8.svg'
import i11 from './svg/11.svg'
import i12 from './svg/12.svg'
import i13 from './svg/13.svg'
import i14 from './svg/14.svg'
import i15 from './svg/15.svg'
import i16 from './svg/16.svg'
import i17 from './svg/17.svg'
import i18 from './svg/18.svg'
import i21 from './svg/21.svg'
import i22 from './svg/22.svg'
import i23 from './svg/23.svg'
import i24 from './svg/24.svg'
import i25 from './svg/25.svg'
import i26 from './svg/26.svg'
import i27 from './svg/27.svg'
import i28 from './svg/28.svg'
import i31 from './svg/31.svg'
import i32 from './svg/32.svg'
import i33 from './svg/33.svg'
import i34 from './svg/34.svg'
import i35 from './svg/35.svg'
import i37 from './svg/37.svg'
import i38 from './svg/38.svg'
import i41 from './svg/41.svg'
import i42 from './svg/42.svg'
import i43 from './svg/43.svg'
import i44 from './svg/44.svg'
import i45 from './svg/45.svg'
import i46 from './svg/46.svg'
import i47 from './svg/47.svg'
import i48 from './svg/48.svg'
import i363 from './svg/363.svg'

/**
 * 일러스트레이션 그리드 — Essenherb 일러스트 40종을 8×5 그리드로 전시한다.
 * - 번호(1~40)마다 카테고리 성격이 붙어 있다(자연 원료 등). 카테고리 체크로 필터.
 * - 랜덤 섞기 지원. 브랜드 무관·props 주입.
 */
type Illustration = { n: number; src: string; category: string; w: number; h: number }

// 파일명이 들쭉날쭉해 정렬 순서로 1~40에 매핑한다. 순서를 바꾸려면 이 배열만 재정렬.
const ORDER = [
	i1,
	i2,
	i3,
	i4,
	i5,
	i6,
	i7,
	i8,
	i11,
	i12,
	i13,
	i14,
	i15,
	i16,
	i17,
	i18,
	i21,
	i22,
	i23,
	i24,
	i25,
	i26,
	i27,
	i28,
	i31,
	i32,
	i33,
	i34,
	i35,
	i37,
	i38,
	i41,
	i42,
	i43,
	i44,
	i45,
	i46,
	i47,
	i48,
	i363,
]

const CATEGORY_RANGES: { label: string; from: number; to: number }[] = [
	{ label: '자연 원료', from: 1, to: 16 },
	{ label: '한국 전통 문화 속 자연', from: 17, to: 24 },
	{ label: '생동감 있는 감정', from: 25, to: 28 },
	{ label: 'Essenherb 제품 제형', from: 29, to: 32 },
	{ label: 'Essenherb 제품 라인업', from: 33, to: 40 },
]

// essenherb 허용 팔레트(Multi 25색). 브랜드별 데이터라 나중에 Brand Resource로 이관 — POC 하드코딩.
// [[brand-assets-hardcode-deferred]]
const ESSENHERB_PALETTE = [
	'#FFF0EB',
	'#FFB4AA',
	'#EA5343',
	'#871400',
	'#460500',
	'#FFFAC2',
	'#FFF095',
	'#FFE65F',
	'#A07D0F',
	'#503200',
	'#E6FFE6',
	'#A7F5AE',
	'#50AE5F',
	'#195F30',
	'#002B1E',
	'#E1F0FF',
	'#A5CDFF',
	'#3C87CD',
	'#1E508C',
	'#001941',
	'#FAFAFA',
	'#EBEBEB',
	'#ACACAC',
	'#464646',
	'#151515',
]

const categoryOf = (n: number) => CATEGORY_RANGES.find((c) => n >= c.from && n <= c.to)?.label ?? ''

const srcOf = (m: string | { src: string }) => (typeof m === 'string' ? m : m.src)

// SVG 고유 종횡비 — 폭 대비 % 크기·수직 이동 계산에 쓴다.
const dimOf = (m: string | { width: number; height: number }) =>
	typeof m === 'string' ? { w: 1, h: 1 } : { w: m.width, h: m.height }

const ILLUSTRATIONS: Illustration[] = ORDER.map((img, i) => ({
	n: i + 1,
	src: srcOf(img),
	category: categoryOf(i + 1),
	...dimOf(img),
}))

// Fisher-Yates. 컴포넌트(브라우저)에서만 도니 Math.random 사용 OK.
function shuffle<T>(list: T[]): T[] {
	const next = [...list]
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[next[i], next[j]] = [next[j], next[i]]
	}
	return next
}

export function IllustrationGrid({
	illustrations = ILLUSTRATIONS,
	palette = ESSENHERB_PALETTE,
}: {
	illustrations?: Illustration[]
	palette?: string[]
}) {
	const categories = useMemo(
		() => [...new Set(illustrations.map((x) => x.category))],
		[illustrations],
	)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	// 0 = 원래 순서, >0 = 클릭할 때마다 새로 섞기
	const [shuffleSeed, setShuffleSeed] = useState(0)
	// 번호별 랜덤 fg/bg. 비어 있으면 기본(검정 실루엣).
	const [colors, setColors] = useState<Record<number, { fg: string; bg: string }>>({})
	// 셀·SVG 배치 — 폭(100%/8)은 고정, 나머지는 모두 폭 대비 %.
	const [heightPct, setHeightPct] = useState(100) // 셀 높이(폭 대비)
	const [svgPct, setSvgPct] = useState(70) // SVG 폭(셀 폭 대비)
	const [offsetPct, setOffsetPct] = useState(0) // SVG 수직 이동(폭 대비, 음수=위)

	// 각 일러스트에 팔레트에서 독립 랜덤 전경색·배경색 지정(fg≠bg로 안 보이는 것 방지).
	const randomizeColors = () => {
		const pick = () => palette[Math.floor(Math.random() * palette.length)]
		const next: Record<number, { fg: string; bg: string }> = {}
		for (const it of illustrations) {
			const fg = pick()
			let bg = pick()
			for (let guard = 0; bg === fg && guard < 10; guard++) bg = pick()
			next[it.n] = { fg, bg }
		}
		setColors(next)
	}

	const toggle = (c: string) =>
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(c)) next.delete(c)
			else next.add(c)
			return next
		})

	const visible = useMemo(() => {
		const filtered =
			selected.size === 0
				? illustrations
				: illustrations.filter((x) => selected.has(x.category))
		// shuffleSeed가 dependency라 섞기 버튼 누를 때만 재계산
		return shuffleSeed > 0 ? shuffle(filtered) : filtered
	}, [illustrations, selected, shuffleSeed])

	return (
		<div className="w-full">
			{/* 카테고리 필터 + 섞기 */}
			<div className="mb-4 flex flex-wrap items-center gap-2">
				{categories.map((c) => {
					const on = selected.has(c)
					return (
						<button
							key={c}
							type="button"
							onClick={() => toggle(c)}
							aria-pressed={on}
							className={`rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm ${
								on ? 'bg-foreground text-background' : 'hover:bg-fill-hover'
							}`}
						>
							{c}
						</button>
					)
				})}
				{selected.size > 0 && (
					<button
						type="button"
						onClick={() => setSelected(new Set())}
						className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
					>
						전체
					</button>
				)}
				<span className="mx-1 h-5 w-px bg-border" />
				<button
					type="button"
					onClick={() => setShuffleSeed((s) => s + 1)}
					className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
				>
					랜덤 섞기
				</button>
				{shuffleSeed > 0 && (
					<button
						type="button"
						onClick={() => setShuffleSeed(0)}
						className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
					>
						순서 복원
					</button>
				)}
				<span className="mx-1 h-5 w-px bg-border" />
				<button
					type="button"
					onClick={randomizeColors}
					className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
				>
					랜덤 컬러
				</button>
				{Object.keys(colors).length > 0 && (
					<button
						type="button"
						onClick={() => setColors({})}
						className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
					>
						컬러 초기화
					</button>
				)}
			</div>

			{/* 배치 컨트롤 — 폭은 100%/8로 고정, 나머지는 폭 대비 % */}
			<div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-md">
				<NumField
					label="셀 높이 (폭 대비 %)"
					value={heightPct}
					onChange={setHeightPct}
					min={1}
				/>
				<NumField
					label="SVG 크기 (폭 대비 %)"
					value={svgPct}
					onChange={setSvgPct}
					min={1}
				/>
				<NumField
					label="SVG 수직 이동 (폭 대비 %)"
					value={offsetPct}
					onChange={setOffsetPct}
				/>
			</div>

			{/* 8열 그리드 — SVG를 CSS mask로 그려 fg(실루엣)·bg를 재색칠한다. */}
			<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
				{visible.map((it) => {
					const c = colors[it.n]
					return (
						<div
							key={it.n}
							className="flex flex-col gap-1 rounded-md border border-border p-2"
							style={c ? { backgroundColor: c.bg } : undefined}
						>
							<span className="font-body text-muted-foreground text-xs">{it.n}</span>
							{/* 폭 대비 %로 높이를 정하는 미디어 박스. cqw가 폭 1%라 SVG 크기·이동을 폭 기준으로 잡는다. */}
							<div
								className="relative w-full"
								style={{
									aspectRatio: `100 / ${heightPct}`,
									containerType: 'inline-size',
								}}
							>
								<div
									role="img"
									aria-label={`일러스트 ${it.n}`}
									className="absolute top-1/2 left-1/2"
									style={{
										width: `${svgPct}%`,
										aspectRatio: `${it.w} / ${it.h}`,
										transform: `translate(-50%, -50%) translateY(${offsetPct}cqw)`,
										backgroundColor: c?.fg ?? '#000000',
										maskImage: `url(${it.src})`,
										maskRepeat: 'no-repeat',
										maskPosition: 'center',
										maskSize: 'contain',
										WebkitMaskImage: `url(${it.src})`,
										WebkitMaskRepeat: 'no-repeat',
										WebkitMaskPosition: 'center',
										WebkitMaskSize: 'contain',
									}}
								/>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function NumField({
	label,
	value,
	onChange,
	min,
}: {
	label: string
	value: number
	onChange: (n: number) => void
	min?: number
}) {
	return (
		<label className="flex flex-col gap-1">
			<span className="font-body font-medium text-muted-foreground text-xs">{label}</span>
			<input
				type="number"
				value={value}
				min={min}
				onChange={(e) => {
					const v = e.target.value === '' ? 0 : Number(e.target.value)
					if (Number.isFinite(v)) onChange(v)
				}}
				className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-body text-foreground text-sm"
			/>
		</label>
	)
}

export function IllustrationGridDemo() {
	return <IllustrationGrid />
}
