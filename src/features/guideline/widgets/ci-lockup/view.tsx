'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SPEC_READOUT } from '../readout'
import { CI_STAGE_DARK, CI_STAGE_LIGHT } from '../surface'
import {
	bearingOf,
	branchLabel,
	CLEAR_SPACE,
	COLOR_TYPE_LABEL,
	COLOR_TYPES,
	type ColorType,
	type Column,
	deriveLockups,
	FIDELITY_CAVEAT,
	FONT,
	fontSizeFor,
	type Language,
	type Lockup,
	lockupOptions,
	MIN_SIZE,
	MONO_COLORS,
	type MonoColor,
	OVERSEAS_BRANCHES,
	partialColumnArea,
	STAGE_HEIGHT,
	SUBSIDIARIES,
	SYMBOL_ASPECT,
	SYMBOL_CONTOURS,
	splitScripts,
	stageTone,
	symbolPoints,
	TIER_LABEL,
	TIERS,
	type Tier,
	textColorName,
	trimFor,
} from './rules'

// CI 락업을 벡터가 아니라 **HTML로 조립한다**. 심볼(승인 아트워크)은 그대로 쓰고, 워드마크만
// 조판해 H비율 그리드에 얹는다. 배치 규칙이 전부 H의 배수라 CSS로 그대로 옮겨진다.
//
// 🔴 자간·행간을 손으로 맞추지 않는다(letter-spacing: normal). 정본과의 차이를 없애면
//    "폰트로 재현 가능한가"를 판정할 수 없다 — 그 판정이 이 위젯의 목적 중 하나다.
// 🔴 폭은 계산하지 않는다. advance width가 균일하지 않고 커닝도 있어 규칙으로 못 낸다.
//    높이·간격만 규칙이 정하고 폭은 폰트 렌더에 맡긴다.
// 🔴 상태를 모듈 스코프에 두지 않는다(docs/11 §4) — 섹션 라우트가 이 위젯을 여러 번 렌더하면
//    인스턴스끼리 값이 엉킨다. 그래서 useState다.
// 🔴 컨트롤은 `components/ui/`에서 가져온다. Studio Controller 킷을 import하지 않는다(docs/11 §8).

/**
 * 🔴 디버그 표시. 트림된 잉크 상자를 눈으로 확인할 때만 `true`로 둔다 — 글자 뒤에 핑크 판이 깔린다.
 * 판이 글자를 딱 감싸면 트림이 맞은 것이고, 위아래나 좌우에 빈틈이 보이면 그만큼 여백이 남은 것이다.
 * 🔴 확인이 끝나면 `false`로 돌리거나 이 상수와 아래 `background` 한 줄을 지운다.
 */
const DEBUG_INK_BOX = false

/** 표현 전환 지속시간(ms). 형태와 색이 같은 값을 써서 함께 움직인다. */
const MORPH_MS = 420

/**
 * 전환 곡선. 🔴 **한 곡선을 CSS와 JS가 같이 쓴다** — 심볼 형태는 JS가 프레임마다 계산하고
 * 색·판·위치는 CSS/WAAPI가 하므로, 곡선이 다르면 같이 움직이는 것들이 어긋나 보인다
 * (실측으로 겪은 것: 텍스트 색만 전환이 없어 점프했고, 위치만 `ease`라 따로 놀았다).
 *
 * `easeOutQuint` 계열 — 처음에 빠르게 튀어나가고 끝을 길게 눌러 앉는다. 오버슛은 넣지 않았다:
 * 색 전환이 목표를 지나치면 색역 밖으로 나가고, 로고 형태가 규정 값을 넘어가 보이는 것도 곤란하다.
 */
const MORPH_BEZIER = [0.22, 1, 0.36, 1] as const
const MORPH_EASING = `cubic-bezier(${MORPH_BEZIER.join(',')})`

/** CSS `transition`·`animate`에 함께 쓰는 값. */
const MORPH = `${MORPH_MS}ms ${MORPH_EASING}`

/**
 * `cubic-bezier`의 y를 x로 구한다 — CSS가 이징으로 하는 계산을 JS에서 똑같이 한다.
 * x(t)를 뉴턴법으로 뒤집어 t를 찾고 y(t)를 낸다(브라우저 구현과 같은 방식).
 */
export function easeMorph(x: number) {
	const [x1, y1, x2, y2] = MORPH_BEZIER
	const cx = 3 * x1
	const bx = 3 * (x2 - x1) - cx
	const ax = 1 - cx - bx
	const cy = 3 * y1
	const by = 3 * (y2 - y1) - cy
	const ay = 1 - cy - by

	let t = x
	for (let i = 0; i < 8; i++) {
		const dx = ((ax * t + bx) * t + cx) * t - x
		if (Math.abs(dx) < 1e-6) break
		const slope = (3 * ax * t + 2 * bx) * t + cx
		if (Math.abs(slope) < 1e-6) break
		t -= dx / slope
	}
	return ((ay * t + by) * t + cy) * t
}

/** H(심볼 높이). 워드마크가 읽히는 크기로 잡았다. */
const H = 100

/**
 * 통합 CI 위젯. 🔑 화면에는 **락업 하나**만 있고 컨트롤이 그것을 갈아끼운다 — 미리 정한 목록을
 * 나열하지 않는다. 단계가 계층을, 꼴·언어가 형태를, 색상 표현이 색과 판을 고른다.
 */
export function CiLockupView({ colors }: { colors: Record<string, string> }) {
	// 🔑 축을 내려도 상위 선택을 지우지 않고 보관한다 — 다시 올리면 그대로 돌아온다.
	const [tier, setTier] = useState<Tier>('ci')
	const [form, setForm] = useState('horizontal')
	const [language, setLanguage] = useState<Language>('ko')
	const [subKo, setSubKo] = useState(SUBSIDIARIES[0].ko)
	const [branchKey, setBranchKey] = useState(branchLabel(OVERSEAS_BRANCHES[0]))
	const [colorType, setColorType] = useState<ColorType>('fullColor')
	const [mono, setMono] = useState<MonoColor>('BLACK')
	const stepId = useId()

	const options = lockupOptions(tier)
	// 🔴 단계마다 가진 세트가 달라, 없는 조합이 선택돼 있으면 첫 항목으로 떨어뜨린다.
	const activeForm = options.forms.some((f) => f.key === form) ? form : options.forms[0].key
	const activeLanguage = options.languages.some((l) => l.key === language)
		? language
		: options.languages[0].key

	const subsidiary = SUBSIDIARIES.find((s) => s.ko === subKo) ?? SUBSIDIARIES[0]
	const branch =
		OVERSEAS_BRANCHES.find((b) => branchLabel(b) === branchKey) ?? OVERSEAS_BRANCHES[0]
	const all = deriveLockups({ tier, subsidiary, branch })
	const lockup = all.find((l) => l.form === activeForm && l.language === activeLanguage) ?? all[0]

	// 🔑 형태와 색이 같은 파라미터 하나로 연속 변한다 — 이산 전환이 아니다.
	const isMono = colorType === 'mono'
	const symbolT = useApproach(isMono ? 1 : 0)
	const hex = (name: string) => colors[name] ?? 'currentColor'
	const symbolColors = isMono
		? SYMBOL_CONTOURS.map(() => hex(mono))
		: SYMBOL_CONTOURS.map((c) => hex(c.colorName))
	// 판은 취향이 아니라 규정이다 — 표현이 정하고 테마를 따르지 않는다(surface.ts).
	const stage = stageTone(colorType, mono) === 'dark' ? CI_STAGE_DARK : CI_STAGE_LIGHT

	const step = TIERS.indexOf(tier) + 1

	return (
		<div className="flex w-full flex-col gap-8">
			{/* 🔑 꼴만 최상위 단독 행이다. 다른 축은 **값**이 바뀌어 위치·색이 이어지지만, 꼴은
				**구조**가 바뀐다(열 개수·심볼 위치) — 이을 수 없는 축을 같은 줄에 섞으면 사용자가
				"왜 이건 안 움직이지"로 읽는다. 분리해 두면 「형태를 갈아끼우는 것」으로 읽힌다.
				정본도 꼴을 고르는 대안이 아니라 페이지마다 다른 승인된 형태로 제시한다. */}
			<Field label="꼴">
				<Choice
					options={options.forms}
					value={activeForm}
					onChange={setForm}
					label="락업 꼴"
				/>
			</Field>

			<div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
				<Field label={`단계 ${step} · ${TIER_LABEL[tier]}`} htmlFor={stepId}>
					<Slider
						id={stepId}
						aria-label="CI 단계"
						aria-valuetext={TIER_LABEL[tier]}
						min={1}
						max={TIERS.length}
						step={1}
						value={[step]}
						onValueChange={([next]) => setTier(TIERS[next - 1])}
					/>
				</Field>

				<Field label="언어" disabled={options.languages.length === 1}>
					<Choice
						options={options.languages}
						value={activeLanguage}
						onChange={(v) => setLanguage(v as Language)}
						label="워드마크 언어"
					/>
				</Field>

				<Field label="자회사" disabled={tier === 'ci'}>
					<Picker
						value={subKo}
						onChange={setSubKo}
						disabled={tier === 'ci'}
						items={SUBSIDIARIES.map((s) => ({ value: s.ko, label: `HD${s.ko}` }))}
					/>
				</Field>

				<Field label="해외지사" disabled={tier !== 'overseas'}>
					<Picker
						value={branchKey}
						onChange={setBranchKey}
						disabled={tier !== 'overseas'}
						items={OVERSEAS_BRANCHES.map((b) => ({
							value: branchLabel(b),
							label: branchLabel(b),
						}))}
					/>
				</Field>

				{/* 🔑 색상 표현이 먼저고, 단색형일 때만 그 한 색을 고른다. 텍스트 색은 따로 없다 —
					표현에 종속된다(rules.ts `textColorName`). */}
				<Field label="색상 표현">
					<Choice
						options={COLOR_TYPES.map((t) => ({ key: t, label: COLOR_TYPE_LABEL[t] }))}
						value={colorType}
						onChange={(v) => setColorType(v as ColorType)}
						label="색상 표현"
					/>
				</Field>

				<Field label="단색 색상" disabled={!isMono}>
					<Choice
						options={MONO_COLORS.map((c) => ({ key: c, label: c }))}
						value={mono}
						onChange={(v) => setMono(v as MonoColor)}
						label="단색형 색상"
					/>
				</Field>
			</div>

			<LockupFigure
				lockup={lockup}
				h={H}
				color={hex(textColorName(colorType, mono))}
				stage={stage}
				symbolT={symbolT}
				symbolColors={symbolColors}
			/>

			<dl className={`flex flex-wrap gap-x-6 gap-y-1 text-xs ${SPEC_READOUT}`}>
				<div>
					<dt className="inline">H</dt> <dd className="inline">{H}px</dd>
				</div>
				<div>
					<dt className="inline">최소 크기</dt>{' '}
					<dd className="inline">
						디지털 {MIN_SIZE.digitalPx}px · 인쇄 {MIN_SIZE.printMm}mm
					</dd>
				</div>
				<div>
					<dt className="inline">클리어스페이스</dt>{' '}
					<dd className="inline">
						가로 {CLEAR_SPACE.horizontal.normal}H · 세로 {CLEAR_SPACE.vertical.normal}H
					</dd>
				</div>
			</dl>

			{/* 🔴 정본 서체가 아니라는 사실을 화면에서 뗄 수 없게 붙여 둔다. */}
			<p className="font-body text-destructive text-xs">{FIDELITY_CAVEAT}</p>
		</div>
	)
}

/** 선택지가 적을 때(2~3개) 쓰는 전환기. 한 번에 다 보여서 비교가 된다. */
function Choice({
	options,
	value,
	onChange,
	label,
}: {
	options: { key: string; label: string }[]
	value: string
	onChange: (next: string) => void
	label: string
}) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			onValueChange={(next) => next && onChange(next)}
			aria-label={label}
			className="w-full"
		>
			{options.map((o) => (
				<ToggleGroupItem key={o.key} value={o.key} className="flex-1">
					{o.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	)
}

/** 선택지가 많을 때 쓰는 목록. 색은 스와치를 함께 보여 준다. */
function Picker({
	value,
	onChange,
	items,
	disabled,
}: {
	value: string
	onChange: (next: string) => void
	items: { value: string; label: string; swatch?: string }[]
	disabled?: boolean
}) {
	return (
		<Select value={value} onValueChange={onChange} disabled={disabled}>
			<SelectTrigger className="w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{items.map((i) => (
					<SelectItem key={i.value} value={i.value}>
						<span className="flex items-center gap-2">
							{i.swatch ? (
								<span
									className="size-3 shrink-0 border border-border"
									style={{ background: i.swatch }}
								/>
							) : null}
							{i.label}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

/** 컨트롤 이름표. 비활성일 때 이유가 보이게 흐리기만 하고 자리는 지킨다. */
function Field({
	label,
	disabled,
	htmlFor,
	children,
}: {
	label: string
	disabled?: boolean
	htmlFor?: string
	children: React.ReactNode
}) {
	return (
		<div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
			{/* 이름표. htmlFor 없는 쓰임에서는 컨트롤이 자기 aria-label을 갖는다. */}
			<label className="font-body text-foreground text-sm" htmlFor={htmlFor}>
				{label}
			</label>
			{children}
		</div>
	)
}

/** 움직임 줄이기를 켠 사용자에겐 전환하지 않는다. */
function reducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 레이아웃이 바뀌어 **덩어리가 다른 자리로 옮겨갈 때** 그 이동을 이어 준다.
 *
 * 🔑 왜 CSS만으로 안 되나: 락업은 판 가운데에 놓이고 폭은 글자가 정한다(`폭은 계산하지 않는다` 주석).
 * 그래서 위치는 레이아웃 결과이고, 레이아웃 결과는 transition 대상이 아니다. 옛 자리를 기억해 두고
 * 새 자리에서 그만큼 거꾸로 밀었다가 놓는 것이 전부다.
 *
 * 🔑 의존 목록이 없다 — 매 렌더에 자리를 재고 **움직였을 때만** 애니메이트한다. 그래서 원인을
 * 열거하지 않아도 된다(글자·꼴·계층·계열사 무엇이 바뀌어도 잡힌다). 안 움직였으면 읽기 두 번으로 끝난다.
 * 🔴 `getBoundingClientRect`가 아니라 `offsetLeft/Top`을 쓴다 — 렌더 사이에 페이지가 스크롤되면
 *    화면 좌표 기준 차이에 스크롤량이 섞여 엉뚱한 거리를 애니메이트한다.
 */
function useSlide() {
	const ref = useRef<HTMLDivElement>(null)
	const previous = useRef<{ x: number; y: number } | null>(null)

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return
		const now = { x: el.offsetLeft, y: el.offsetTop }
		const before = previous.current
		previous.current = now
		if (!before || reducedMotion()) return
		const dx = before.x - now.x
		const dy = before.y - now.y
		if (dx === 0 && dy === 0) return
		el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
			duration: MORPH_MS,
			easing: MORPH_EASING,
		})
	})

	return ref
}

/**
 * 목표값으로 **연속** 접근하는 값. 🔴 형태 보간이 필요한데 `<polygon points>`는 CSS로 보간되지 않아
 * (transition 대상이 아니다) 여기서 프레임마다 계산한다. 색은 CSS `fill` transition이 맡고 같은
 * 지속시간을 쓰므로 형태와 색이 함께 움직인다.
 *
 * 🔴 백그라운드 탭에서는 rAF가 멈춘다(실측: 500ms에 2프레임). 아무도 안 보는 동안 멈추는 것이
 *    맞는 동작이고, 탭이 보이면 남은 구간을 이어서 끝낸다 — `p`가 경과 시간으로 계산되므로
 *    오래 숨어 있었으면 돌아온 첫 프레임에 목표로 스냅한다.
 */
function useApproach(target: number, ms = MORPH_MS) {
	const [value, setValue] = useState(target)
	const current = useRef(target)

	useEffect(() => {
		const from = current.current
		if (from === target) return
		// 🔴 움직임을 줄여 달라고 한 사용자에게는 보간하지 않고 바로 목표로 간다.
		if (reducedMotion()) {
			current.current = target
			setValue(target)
			return
		}
		const start = performance.now()
		let frame = 0
		const step = (now: number) => {
			// 🔴 clamp 필수 — rAF 타임스탬프가 `start`보다 이전일 수 있어(프레임 시작 시각) `p`가
			//    한 프레임 음수가 되고, 그러면 정점이 유효 범위를 벗어난다(실측: -0.0008).
			const p = Math.min(1, Math.max(0, (now - start) / ms))
			// 🔑 CSS와 같은 곡선을 쓴다 — 형태와 색이 같은 리듬으로 움직이게.
			current.current = from + (target - from) * easeMorph(p)
			setValue(current.current)
			if (p < 1) frame = requestAnimationFrame(step)
		}
		frame = requestAnimationFrame(step)
		return () => cancelAnimationFrame(frame)
	}, [target, ms])

	return value
}

/**
 * 심볼. 🔑 정삼각 격자 위 삼각형 3개를 좌표에서 직접 그린다 — 이미지도, 마스크도, 폰트도 아니다.
 * `t`가 0→1로 가면 이음선이 벌어지고(`symbolPoints`) 동시에 색이 단색으로 물든다.
 */
function SymbolMark({
	h,
	t,
	colors,
	marginTop,
}: {
	h: number
	t: number
	colors: string[]
	marginTop: number | undefined
}) {
	return (
		<svg
			viewBox={`0 0 ${SYMBOL_ASPECT} 1`}
			width={h * SYMBOL_ASPECT}
			height={h}
			style={{ marginTop }}
			className="block shrink-0 overflow-visible"
			aria-hidden="true"
		>
			{symbolPoints(t).map((points, i) => (
				<polygon
					key={SYMBOL_CONTOURS[i].colorName}
					points={points.map(([x, y]) => `${x},${y}`).join(' ')}
					fill={colors[i]}
					style={{ transition: `fill ${MORPH}` }}
				/>
			))}
		</svg>
	)
}

function LockupFigure({
	lockup,
	h,
	color,
	stage,
	symbolT,
	symbolColors,
}: {
	lockup: Lockup
	h: number
	color: string
	stage: string
	symbolT: number
	symbolColors: string[]
}) {
	const assumed =
		lockup.columns.some((column) => column.rows.some((row) => row.assumed)) ||
		Boolean(lockup.note)

	return (
		<figure className="flex flex-col gap-3">
			{/* 🔴 판은 밝아야 한다(기본형 Full Color는 밝은 배경 전용). 다크 모드에서도 마찬가지다.
				overflow-x-auto는 안전망이다 — 좁은 자리에서도 로고를 자르지 않고 흘려보낸다. */}
			{/* 🔴 판 크기는 **고정**이다(`STAGE_HEIGHT`). 선택에 따라 판이 커졌다 작아지면 위젯이
				위아래로 튀어 락업이 아니라 화면이 움직이는 것처럼 보인다. 안의 락업만 변한다.
				판 색은 표현이 정하고 테마를 따르지 않으므로 전환도 여기서 이어 준다. */}
			<div
				className="flex items-center justify-center overflow-x-auto border border-border px-8"
				style={{
					background: stage,
					height: h * STAGE_HEIGHT,
					transition: `background-color ${MORPH}`,
				}}
			>
				<Composed
					lockup={lockup}
					h={h}
					color={color}
					symbolT={symbolT}
					symbolColors={symbolColors}
				/>
			</div>
			<figcaption className="flex flex-col gap-1">
				<span className="font-body text-foreground text-sm">
					{lockup.label}
					{assumed ? (
						<span className="ml-2 font-body text-destructive text-xs">
							브랜드팀 확인 필요
						</span>
					) : null}
				</span>
				<span className={`${SPEC_READOUT} text-xs`}>{lockup.source}</span>
				{lockup.note ? (
					<span className="font-body text-destructive text-xs">{lockup.note}</span>
				) : null}
			</figcaption>
		</figure>
	)
}

/** 심볼 + 워드마크를 H비율로 얹는다. 여기 있는 값은 전부 rules.ts에서 온다. */
function Composed({
	lockup,
	h,
	color,
	symbolT,
	symbolColors,
}: {
	lockup: Lockup
	h: number
	color: string
	symbolT: number
	symbolColors: string[]
}) {
	const horizontal = lockup.orientation === 'horizontal'
	// 열이 여럿이면 모든 열이 같은 영역 높이를 공유한다 — 구분바 높이와 하단정렬이 그것을 기준으로 잡힌다.
	const areaPx = lockup.area !== undefined ? lockup.area * h : undefined

	/**
	 * 🔑 심볼이 열 **전체**가 아니라 앞 몇 행에 맞는 꼴이 있다(해외지사 가로형B의 2×2 그리드).
	 * 그때는 flex 중앙정렬을 쓸 수 없어서 — 그러면 매달린 지역명까지 포함해 가운데를 잡는다 —
	 * 위에서부터 쌓고 심볼을 그 블록 중앙으로 끌어올린다.
	 */
	const baseTop =
		lockup.baseRows === undefined
			? undefined
			: (partialColumnArea(lockup, lockup.columns[0], lockup.baseRows) * h - h) / 2

	// 글자·꼴·계층이 바뀌면 덩어리의 자리가 바뀐다 — 그 이동을 이어 준다.
	const slideRef = useSlide()

	return (
		<div
			ref={slideRef}
			className={`flex ${horizontal ? `flex-row ${baseTop === undefined ? 'items-center' : 'items-start'}` : 'flex-col items-center'}`}
			style={{ gap: h * lockup.gap }}
		>
			{/* 심볼은 형상 규칙으로 그린다 — 이미지가 아니다(SYMBOL_CONTOURS 주석). */}
			<SymbolMark h={h} t={symbolT} colors={symbolColors} marginTop={baseTop} />

			{/* 🔴 열 사이는 flex gap이 아니라 열마다의 marginLeft다 — 열마다 간격이 다를 수 있다. */}
			{/* 🔴 `color`에도 전환이 필요하다 — 없으면 심볼은 물드는데 글자만 즉시 점프해 어긋난다. */}
			<div
				className="flex shrink-0 flex-row items-stretch"
				style={{ color, transition: `color ${MORPH}` }}
			>
				{lockup.columns.map((column, i) => (
					<ColumnStack
						key={column.bar ? `bar-${i}` : column.rows.map((r) => r.text).join('/')}
						lockup={lockup}
						column={column}
						h={h}
						areaPx={areaPx}
						first={i === 0}
					/>
				))}
			</div>
		</div>
	)
}

/**
 * 워드마크 한 열. 🔴 `align: 'bottom'`이면 2행 그리드의 아래 행에 붙는다 — 그러려면 열이 영역
 * 높이만큼 자리를 차지해야 하므로 `minHeight`를 준다. 구분바 열은 글자 없이 면만 그린다.
 */
function ColumnStack({
	lockup,
	column,
	h,
	areaPx,
	first,
}: {
	lockup: Lockup
	column: Column
	h: number
	areaPx: number | undefined
	first: boolean
}) {
	const marginLeft = first ? 0 : h * (column.gapBefore ?? 0)

	if (column.bar !== undefined) {
		// 구분바 높이는 열 영역 전체다(실측). 영역이 없으면 그릴 근거가 없어 렌더하지 않는다.
		return areaPx === undefined ? null : (
			<div
				style={{
					marginLeft,
					width: h * column.bar,
					height: areaPx,
					background: 'currentColor',
				}}
				className="shrink-0 self-center"
			/>
		)
	}

	const horizontal = lockup.orientation === 'horizontal'
	return (
		<div
			className={`flex shrink-0 flex-col ${horizontal ? 'items-start' : 'items-center'} ${
				column.align === 'bottom' ? 'justify-end' : ''
			}`}
			style={{
				marginLeft,
				...(column.align === 'bottom' && areaPx ? { minHeight: areaPx } : {}),
			}}
		>
			{column.rows.map((row, i) => (
				<CapLine
					key={row.text}
					text={row.text}
					cap={row.cap}
					h={h}
					gapBefore={i === 0 ? 0 : (row.gapBefore ?? lockup.rowGap)}
				/>
			))}
		</div>
	)
}

/**
 * 한 줄을 **잉크 높이가 정확히 `cap × H`가 되도록** 그린다.
 * 🔴 상자 높이가 cap과 같아야 그 위아래 간격(lineGap·gap)이 스펙대로 성립한다. font-size를 그대로
 *    쓰면 어센더·디센더 여백까지 상자에 포함돼 정본보다 벌어진다.
 * 🔴 서체는 하나인데 한 줄 안에서 **경우마다 글자 크기가 다르다**(`HD현대`의 `HD`와 `현대`).
 *    서체가 라틴 대문자와 한글을 다른 크기로 그리는데 정본은 둘의 위아래 끝이 같기 때문이다(FONT 주석).
 *    각 조각을 자기 잉크 상자로 트림하면 남는 높이가 양쪽 다 `cap × H`라, 나란히 놓기만 하면 맞는다.
 * 🔴 좌우도 같이 걷어낸다 — 줄 첫 글자의 왼쪽 여백과 마지막 글자의 오른쪽 여백. 이걸 안 하면
 *    심볼–워드마크 간격이 규정(0.25H)보다 벌어지고, 세로형의 가운데 정렬도 잉크 기준이 아니게 된다.
 */
function CapLine({
	text,
	cap,
	h,
	gapBefore,
}: {
	text: string
	cap: number
	h: number
	/** 이 줄 위의 간격(H 배수). */
	gapBefore: number
}) {
	return (
		<span
			className="flex items-start"
			style={{
				marginTop: h * gapBefore,
				// 🔴 이 상자가 곧 트림 결과다 — 높이 = cap × H, 폭 = 잉크 폭. DEBUG_INK_BOX 주석 참조.
				background: DEBUG_INK_BOX ? 'rgb(255 0 255 / 0.35)' : undefined,
			}}
		>
			{splitScripts(text).map((run, i, runs) => {
				const trim = trimFor(run.script)
				// 좌우 여백은 줄의 양 끝에서만 걷어낸다 — 조각 사이는 원래 글자 간격이라 건드리지 않는다.
				const left = i === 0 ? bearingOf(run.text[0], run.script).left : 0
				const right =
					i === runs.length - 1 ? bearingOf(run.text.at(-1), run.script).right : 0
				return (
					<span
						key={`${run.script}-${run.text}`}
						className="whitespace-pre"
						style={{
							fontFamily: FONT.family,
							fontWeight: FONT.weight,
							fontSize: fontSizeFor(cap, h, run.script),
							lineHeight: 1,
							// 자간은 건드리지 않는다 — 정본과의 차이가 보여야 판정이 된다.
							letterSpacing: 'normal',
							marginTop: `${trim.top}em`,
							marginBottom: `${trim.bottom}em`,
							marginLeft: `${-left}em`,
							marginRight: `${-right}em`,
						}}
					>
						{run.text}
					</span>
				)
			})}
		</span>
	)
}

export default CiLockupView
