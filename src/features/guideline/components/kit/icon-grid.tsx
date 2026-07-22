'use client'

import { motion } from 'motion/react'
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
 * 아이콘 그리드 — Essenherb 아이콘(일러스트) 40종을 8×5 그리드로 전시한다.
 * - user 조작(뷰어): 태그(카테고리) 필터 · 색상 반전 · 랜덤 섞기.
 * - manager 설정값(prop, 추후 Payload 블록 필드로 승격): 컬러/흑백(colored) · 셀 높이 · SVG 크기 · SVG 수직 이동.
 *   → 이 값들은 뷰어 UI에 노출하지 않고 prop처럼 저장되는 값이다.
 * - 흑백↔컬러: 같은 SVG를 CSS mask로 그려 fg(실루엣)·bg(셀)를 색칠한다.
 * - 카드 이동은 motion layout(섞기 애니메이션), 호버는 살짝 확대.
 */
type Imported = { src: string; width: number; height: number }
type Illustration = {
	n: number
	src: string
	category: string
	w: number
	h: number
	fg: string
	bg: string
}

// 원본 이미지 순서(1~40)로 SVG + 이미지에서 찍은 색(essenherb 팔레트로 스냅)을 묶는다.
const SAMPLED: { img: Imported; bg: string; fg: string }[] = [
	{ img: i1, bg: '#EA5343', fg: '#FFF095' },
	{ img: i2, bg: '#E1F0FF', fg: '#EA5343' },
	{ img: i3, bg: '#FFE65F', fg: '#503200' },
	{ img: i4, bg: '#FAEBFF', fg: '#A546BE' },
	{ img: i5, bg: '#50AE5F', fg: '#FFE65F' },
	{ img: i6, bg: '#FFFAC2', fg: '#50AE5F' },
	{ img: i7, bg: '#FAEBFF', fg: '#EA5343' },
	{ img: i8, bg: '#002B1E', fg: '#50AE5F' },
	{ img: i11, bg: '#3C87CD', fg: '#A5CDFF' },
	{ img: i12, bg: '#A546BE', fg: '#FFB4AA' },
	{ img: i13, bg: '#E6FFE6', fg: '#50AE5F' },
	{ img: i14, bg: '#EA5343', fg: '#FFFFFF' },
	{ img: i15, bg: '#A5CDFF', fg: '#001941' },
	{ img: i16, bg: '#FAEBFF', fg: '#50AE5F' },
	{ img: i17, bg: '#A7F5AE', fg: '#3C87CD' },
	{ img: i18, bg: '#3C87CD', fg: '#FFFFFF' },
	{ img: i21, bg: '#FFFAC2', fg: '#A07D0F' },
	{ img: i22, bg: '#EA5343', fg: '#871400' },
	{ img: i23, bg: '#3C87CD', fg: '#001941' },
	{ img: i24, bg: '#E1F0FF', fg: '#EA5343' },
	{ img: i25, bg: '#FFE65F', fg: '#871400' },
	{ img: i26, bg: '#E1F0FF', fg: '#A5CDFF' },
	{ img: i27, bg: '#FFE65F', fg: '#EA5343' },
	{ img: i28, bg: '#001941', fg: '#3C87CD' },
	{ img: i31, bg: '#E6FFE6', fg: '#EA5343' },
	{ img: i32, bg: '#E1F0FF', fg: '#50AE5F' },
	{ img: i33, bg: '#A7F5AE', fg: '#195F30' },
	{ img: i34, bg: '#3C0046', fg: '#FFE65F' },
	{ img: i35, bg: '#A5CDFF', fg: '#3C87CD' },
	{ img: i37, bg: '#EA5343', fg: '#FFB4AA' },
	{ img: i38, bg: '#50AE5F', fg: '#A7F5AE' },
	{ img: i41, bg: '#FAEBFF', fg: '#A546BE' },
	{ img: i42, bg: '#FFE65F', fg: '#EA5343' },
	{ img: i43, bg: '#FFF0EB', fg: '#A5CDFF' },
	{ img: i44, bg: '#A5CDFF', fg: '#EA5343' },
	{ img: i45, bg: '#50AE5F', fg: '#FFE65F' },
	{ img: i46, bg: '#EA5343', fg: '#FFFAC2' },
	{ img: i47, bg: '#FFE65F', fg: '#3C87CD' },
	{ img: i48, bg: '#3C0046', fg: '#A7F5AE' },
	{ img: i363, bg: '#FFE65F', fg: '#503200' },
]

// 40번(마지막)을 32번으로 옮기고 그 뒤(옛 32~39)를 하나씩 뒤로 민다. 색은 일러스트와 함께 이동.
const ORDERED = (() => {
	const arr = [...SAMPLED]
	const [moved] = arr.splice(39, 1)
	arr.splice(31, 0, moved)
	return arr
})()

const CATEGORY_RANGES: { label: string; from: number; to: number }[] = [
	{ label: '자연 원료', from: 1, to: 16 },
	{ label: '한국 전통 문화 속 자연', from: 17, to: 24 },
	{ label: '생동감 있는 감정', from: 25, to: 28 },
	{ label: 'Essenherb 제품 제형', from: 29, to: 32 },
	{ label: 'Essenherb 제품 라인업', from: 33, to: 40 },
]

// 흑백 모드 색(반전 시 서로 스왑되므로 배경도 실색으로 둔다).
const BW = { fg: '#151515', bg: '#FFFFFF' }
// manager가 admin에서 조정하는 배치 기본값(폭 대비 %). 추후 블록 필드의 default가 된다.
const DEFAULT_LAYOUT = { heightPct: 100, svgPct: 70, offsetPct: 0 }

const categoryOf = (n: number) => CATEGORY_RANGES.find((c) => n >= c.from && n <= c.to)?.label ?? ''

const srcOf = (m: string | { src: string }) => (typeof m === 'string' ? m : m.src)
const dimOf = (m: Imported) => ({ w: m.width, h: m.height })

const ILLUSTRATIONS: Illustration[] = ORDERED.map((s, i) => ({
	n: i + 1,
	src: srcOf(s.img),
	category: categoryOf(i + 1),
	fg: s.fg,
	bg: s.bg,
	...dimOf(s.img),
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

export function IconGrid({
	illustrations = ILLUSTRATIONS,
	colored = false,
	heightPct = DEFAULT_LAYOUT.heightPct,
	svgPct = DEFAULT_LAYOUT.svgPct,
	offsetPct = DEFAULT_LAYOUT.offsetPct,
}: {
	illustrations?: Illustration[]
	/** 컬러(true)/흑백(false). 뷰어에 토글로 노출하지 않고 manager가 Payload admin에서 설정하는 값. */
	colored?: boolean
	/** 셀 높이(폭 대비 %). manager 설정값. */
	heightPct?: number
	/** SVG 크기(폭 대비 %). manager 설정값. */
	svgPct?: number
	/** SVG 수직 이동(폭 대비 %). manager 설정값. */
	offsetPct?: number
}) {
	const categories = useMemo(
		() => [...new Set(illustrations.map((x) => x.category))],
		[illustrations],
	)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	// 0 = 원래 순서, >0 = 클릭할 때마다 새로 섞기
	const [shuffleSeed, setShuffleSeed] = useState(0)
	const [inverted, setInverted] = useState(false) // 전경↔배경 스왑

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

	// colored(manager 설정)·inverted(뷰어 조작)를 반영한 최종 전경/배경색.
	const cellColors = (it: Illustration) => {
		const fg = colored ? it.fg : BW.fg
		const bg = colored ? it.bg : BW.bg
		return inverted ? { fg: bg, bg: fg } : { fg, bg }
	}

	return (
		<div className="w-full">
			{/* 뷰어 조작: 태그 필터 + 색상 반전 + 랜덤 섞기 */}
			<div className="mb-4 flex flex-wrap items-center gap-2">
				{categories.map((c) => {
					const on = selected.has(c)
					return (
						<button
							key={c}
							type="button"
							onClick={() => toggle(c)}
							aria-pressed={on}
							className={`px-3 py-1.5 font-body font-medium text-sm ${
								on ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-fill-hover'
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
						className="px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
					>
						전체
					</button>
				)}
				<span className="mx-1 h-5 w-px bg-border" />
				<button
					type="button"
					onClick={() => setInverted((v) => !v)}
					aria-pressed={inverted}
					className={`px-3 py-1.5 font-body font-medium text-sm ${
						inverted ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-fill-hover'
					}`}
				>
					색상 반전
				</button>
				<button
					type="button"
					onClick={() => setShuffleSeed((s) => s + 1)}
					className="px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
				>
					랜덤 섞기
				</button>
				{shuffleSeed > 0 && (
					<button
						type="button"
						onClick={() => setShuffleSeed(0)}
						className="px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
					>
						순서 복원
					</button>
				)}
			</div>

			{/* 8열 그리드 — border/radius 없음. SVG는 CSS mask로 그려 fg(실루엣)·bg를 색칠. */}
			<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
				{visible.map((it) => {
					const { fg, bg } = cellColors(it)
					return (
						<motion.div
							key={it.n}
							layout
							whileHover={{ scale: 1.04 }}
							transition={{ type: 'spring', stiffness: 500, damping: 40 }}
							className="flex flex-col gap-1 p-2"
							style={{ backgroundColor: bg }}
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
									aria-label={`아이콘 ${it.n}`}
									className="absolute top-1/2 left-1/2 transition-[background-color] duration-300"
									style={{
										width: `${svgPct}%`,
										aspectRatio: `${it.w} / ${it.h}`,
										transform: `translate(-50%, -50%) translateY(${offsetPct}cqw)`,
										backgroundColor: fg,
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
						</motion.div>
					)
				})}
			</div>
		</div>
	)
}

export function IconGridDemo() {
	return <IconGrid />
}
