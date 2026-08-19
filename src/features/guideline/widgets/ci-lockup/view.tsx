'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	controllerBoolean,
	controllerNumber,
	controllerString,
	useGuidelineController,
} from '../../controllers/provider'
import { SPEC_READOUT } from '../readout'
import { CI_STAGE_DARK, CI_STAGE_LIGHT } from '../surface'
import { LockupDiagram } from './diagram'
import { downloadSvg, lockupSvg } from './export-svg'
import { BRANCH_VALUES, FORM_VALUES, HEIGHT, LANGUAGE_VALUES, SUBSIDIARY_VALUES } from './manifest'
import { easeMorph, MORPH, type MORPH_EASING, MORPH_MS, morph, reducedMotion } from './motion'
import {
	bearingOf,
	branchLabel,
	CLEAR_SPACE,
	CLEAR_SPACE_MODES,
	type ClearSpaceMode,
	COLOR_TYPES,
	type ColorType,
	type Column,
	clearSpaceFor,
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
	textColorName,
	tierFor,
	trimFor,
} from './rules'

// CI 락업을 벡터가 아니라 **HTML로 조립한다**. 심볼(승인 아트워크)은 그대로 쓰고, 워드마크만
// 조판해 H비율 그리드에 얹는다. 배치 규칙이 전부 H의 배수라 CSS로 그대로 옮겨진다.
//
// 🔴 자간·행간을 손으로 맞추지 않는다(letter-spacing: normal). 정본과의 차이를 없애면
//    "폰트로 재현 가능한가"를 판정할 수 없다 — 그 판정이 이 위젯의 목적 중 하나다.
// 🔴 폭은 계산하지 않는다. advance width가 균일하지 않고 커닝도 있어 규칙으로 못 낸다.
//    높이·간격만 규칙이 정하고 폭은 폰트 렌더에 맡긴다.
// 🔴 이 위젯은 **컨트롤을 그리지 않는다**(docs/11 §4.1). 무엇을 조절할 수 있는지는 `manifest.ts`가
//    선언하고 하단 알약이 그린다. 여기 남는 것은 Canvas — 값을 읽어 락업을 그리는 일뿐이다.
// 🔴 값 스코프는 **블록 단위**다(`controllers/provider.tsx`). 섹션 라우트가 이 위젯을 여러 번
//    렌더해도 블록마다 자기 값을 갖는다.

/**
 * 🔴 디버그 표시. 트림된 잉크 상자를 눈으로 확인할 때만 `true`로 둔다 — 글자 뒤에 핑크 판이 깔린다.
 * 판이 글자를 딱 감싸면 트림이 맞은 것이고, 위아래나 좌우에 빈틈이 보이면 그만큼 여백이 남은 것이다.
 * 🔴 확인이 끝나면 `false`로 돌리거나 이 상수와 아래 `background` 한 줄을 지운다.
 */
const DEBUG_INK_BOX = false

/**
 * 통합 CI 위젯의 **Canvas**. 🔑 화면에는 락업 하나만 있고, 그것을 갈아끼우는 값은 알약에서 온다.
 * 계층은 켜기 두 개에서 파생되고(본사 = 아무것도 켜지 않은 상태), 꼴·언어가 형태를,
 * 색상 표현이 색과 판을 정한다.
 */
/**
 * 인스턴스 고정값. admin이 이 블록 자식에 넣은 값이고, **알약에서 뺀 축에만** 적용된다.
 *
 * 🔑 그래서 한 블록에 위젯을 여럿 둘 수 있다 — 스코프는 블록당 하나이므로 알약에 남은 축은
 *    판들이 **함께** 움직이고(H·클리어스페이스·치수), 뺀 축은 판마다 자기 값에 머문다(꼴·색상 표현).
 *    정본 지면이 그렇게 구성돼 있다: 가로형·세로형을 나란히, 표현 3종을 나란히.
 * 🔴 규칙은 하나다 — 뺀 축이면 자기 값, 아니면 컨트롤러 값. `layout-grid`의 `override ??` 선례에
 *    「무엇을 뺐나」를 더한 형태다(그쪽은 lock 플래그를 따로 받는다).
 */
export type CiLockupFixed = {
	h?: number | null
	subsidiaryOn?: boolean | null
	subsidiary?: string | null
	branchOn?: boolean | null
	branch?: string | null
	form?: string | null
	language?: string | null
	colorType?: string | null
	mono?: string | null
	clearSpace?: string | null
	measured?: boolean | null
	/** 알약에서 뺀 축 목록. 이것이 「어느 값을 자기 것으로 쓸지」를 정한다. */
	hiddenControls?: (string | null)[] | null
}

export function CiLockupView({
	colors,
	fixed = {},
}: {
	colors: Record<string, string>
	fixed?: CiLockupFixed
}) {
	// 🔑 값의 뜻은 여기가 갖고, 알약은 id로만 넣고 뺀다. 그래서 fallback을 여기서 준다 —
	//    스코프 밖(위젯 갤러리처럼 블록 없이 렌더)에서도 락업이 그려져야 한다.
	const { values } = useGuidelineController()
	// 🔑 뺀 축이면 자기 값, 아니면 알약 값. 스코프 밖이면 알약 값이 매니페스트 기본값으로 떨어진다.
	const off = new Set((fixed.hiddenControls ?? []).filter((id): id is string => Boolean(id)))
	const pick = <T,>(id: string, own: T | null | undefined, live: T): T =>
		off.has(id) && own !== null && own !== undefined ? own : live

	/** H(심볼 높이). 🔑 락업의 모든 치수가 이 값의 배수다 — 판형을 정하는 단 하나의 값이다. */
	const H = pick('h', fixed.h, controllerNumber(values, 'h', HEIGHT.defaultValue))
	const subOn = pick(
		'subsidiaryOn',
		fixed.subsidiaryOn,
		controllerBoolean(values, 'subsidiaryOn', false),
	)
	const branchOn = pick('branchOn', fixed.branchOn, controllerBoolean(values, 'branchOn', false))
	const form = pick(
		'form',
		fixed.form,
		controllerString(values, 'form', FORM_VALUES, 'horizontal'),
	)
	const language = pick(
		'language',
		fixed.language as Language | null | undefined,
		controllerString(values, 'language', LANGUAGE_VALUES, 'ko'),
	)
	const subKo = pick(
		'subsidiary',
		fixed.subsidiary,
		controllerString(values, 'subsidiary', SUBSIDIARY_VALUES, SUBSIDIARIES[0].ko),
	)
	const branchKey = pick(
		'branch',
		fixed.branch,
		controllerString(values, 'branch', BRANCH_VALUES, branchLabel(OVERSEAS_BRANCHES[0])),
	)
	const colorType = pick(
		'colorType',
		fixed.colorType as ColorType | null | undefined,
		controllerString(values, 'colorType', COLOR_TYPES, 'fullColor'),
	)
	const mono = pick(
		'mono',
		fixed.mono as MonoColor | null | undefined,
		controllerString(values, 'mono', MONO_COLORS, 'BLACK'),
	)
	const clearSpaceMode = pick(
		'clearSpace',
		fixed.clearSpace as ClearSpaceMode | null | undefined,
		controllerString(values, 'clearSpace', CLEAR_SPACE_MODES, 'off'),
	)
	/** 치수 도판. 🔴 규정을 **보여주기만** 한다 — 간격은 조정 대상이 아니다(금지규정 #9). */
	const measured = pick('measured', fixed.measured, controllerBoolean(values, 'measured', false))

	// 계층 파생 규칙은 rules.ts가 소유한다(`tierFor`) — 켜짐 종속·보관 이유가 그 주석에 있다.
	const tier = tierFor(subOn, branchOn)

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
	const tone = stageTone(colorType, mono)
	const stage = tone === 'dark' ? CI_STAGE_DARK : CI_STAGE_LIGHT
	const clearSpace = clearSpaceFor(lockup.orientation, clearSpaceMode)

	return (
		<div className="flex w-full flex-col gap-8">
			<LockupFigure
				lockup={lockup}
				h={H}
				color={hex(textColorName(colorType, mono))}
				stage={stage}
				symbolT={symbolT}
				symbolColors={symbolColors}
				clearSpace={clearSpace}
				diagram={
					measured ? (
						<LockupDiagram
							lockup={lockup}
							siblings={all}
							h={H}
							tone={tone}
							color={hex(textColorName(colorType, mono))}
							colors={colors}
							stage={stage}
							symbolT={symbolT}
							symbolColors={symbolColors}
						/>
					) : null
				}
			/>

			<dl className={`flex flex-wrap gap-x-6 gap-y-1 text-xs ${SPEC_READOUT}`}>
				{/* 🔑 지금 무엇을 보고 있나. 컨트롤이 라벨로 상태를 중복 서술하지 않아도 되게 하고,
					선택지가 하나뿐이라 그리지 않은 축(해외지사의 언어)이 여기서 읽힌다. */}
				<div>
					<dt className="inline">락업</dt> <dd className="inline">{lockup.label}</dd>
				</div>
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

/**
 * 전환기의 슬롯. 하위 선택이 없으면 항목 하나(`key`), 있으면 **반으로 갈린 캡슐**(`cap`+`halves`)이다.
 */

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
		const now = anchorOf(el)
		const before = previous.current
		previous.current = now
		if (!before || reducedMotion()) return
		const dx = before.x - now.x
		const dy = before.y - now.y
		if (dx === 0 && dy === 0) return
		morph(el, { transform: `translate(${dx}px, ${dy}px)` })
	})

	return ref
}

/**
 * 🔑 **상자가 아니라 심볼을 기준으로 잰다.** 상자(`ClearSpaceFrame`)는 판 가운데에 놓이므로, 글자가
 * 길어지면 상자의 왼쪽 끝은 움직이는데 그 안에서 **가운데 정렬된** 심볼은 제자리다. 상자 기준으로
 * 되돌리면 심볼이 그 차이만큼 끌려갔다 돌아온다(실측: 세로형 본사 언어 전환에서 16px 왕복 —
 * 사용자 지적 「로고가 순간이동」). 크기를 함께 이어도 안 된다: 판이 상자를 가운데 두므로 폭을
 * 되돌리는 것만으로 이미 옛 자리가 재현되어, 이동까지 얹으면 **같은 이동을 두 번** 센다.
 *
 * 🔴 심볼 좌표는 상자와의 **차이**로 잰다 — 두 rect가 같은 페인트에서 나오므로 스크롤도, 전환 중인
 *    translate도 상쇄된다. 거기에 레이아웃 값인 `offsetLeft/Top`을 더해 절대 좌표를 만든다.
 */
function anchorOf(el: HTMLElement) {
	const symbol = el.querySelector('[data-ink="symbol"]')
	if (!symbol) return { x: el.offsetLeft, y: el.offsetTop }
	const box = el.getBoundingClientRect()
	const ink = symbol.getBoundingClientRect()
	return { x: el.offsetLeft + (ink.left - box.left), y: el.offsetTop + (ink.top - box.top) }
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
export function SymbolMark({
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
			// 🔑 잉크 마커. 심볼을 「그 안의 유일한 svg」로 짐작하지 않게 글자·구분바와 같은 어휘를
			//    쓴다 — 내보내기(`export-svg.ts`)와 덩어리 이동 기준(`anchorOf`)이 이것으로 찾는다.
			data-ink="symbol"
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
	clearSpace,
	diagram,
}: {
	lockup: Lockup
	h: number
	color: string
	stage: string
	symbolT: number
	symbolColors: string[]
	/** 여백(H 배수). 0이면 그리지 않는다. */
	clearSpace: number
	/** 치수 도판. 있으면 판 안의 락업을 이것으로 갈아끼운다(같은 자리·같은 판 크기). */
	diagram: React.ReactNode
}) {
	const assumed =
		lockup.columns.some((column) => column.rows.some((row) => row.assumed)) ||
		Boolean(lockup.note)

	const stageRef = useRef<HTMLDivElement>(null)
	/* 🔑 내보내기는 **화면에 있는 것을 옮겨 적는다** — 좌표를 다시 만들지 않는다(`export-svg.ts`).
	   🔴 치수 도판이 켜져 있으면 락업이 판에서 빠져 있어 내보낼 잉크가 없다. */
	const download = async (withBackground: boolean) => {
		const stage = stageRef.current
		const root = withBackground ? stage : stage?.querySelector<HTMLElement>('[data-lockup]')
		if (!root) return
		const what = withBackground ? '판' : '로고'
		downloadSvg(`${lockup.label} ${what}.svg`, await lockupSvg(root, withBackground))
	}

	return (
		<figure className="flex flex-col gap-3">
			{/* 🔴 판은 밝아야 한다(기본형 Full Color는 밝은 배경 전용). 다크 모드에서도 마찬가지다.
				overflow-x-auto는 안전망이다 — 좁은 자리에서도 로고를 자르지 않고 흘려보낸다. */}
			{/* 🔴 안쪽 패딩을 두지 않는다(사용자 지정 2026-08-19) — 판은 캔버스이고, 그 안의 것이
				판 끝까지 닿을 수 있어야 한다. 여백이 필요한 것은 판이 아니라 락업이고 그것은
				클리어스페이스가 규정으로 갖는다. */}
			{/* 🔴 판 크기는 **고정**이다(`STAGE_HEIGHT`). 선택에 따라 판이 커졌다 작아지면 위젯이
				위아래로 튀어 락업이 아니라 화면이 움직이는 것처럼 보인다. 안의 락업만 변한다.
				판 색은 표현이 정하고 테마를 따르지 않으므로 전환도 여기서 이어 준다. */}
			<div
				ref={stageRef}
				className="flex items-center justify-center overflow-x-auto border border-border"
				style={{
					background: stage,
					height: h * STAGE_HEIGHT,
					// 🔴 높이에도 전환이 필요하다 — H가 컨트롤러 축이 된 뒤로 한 칸 올릴 때마다 판이
					//    32px씩 즉시 커져 그 아래 문서 전체가 튄다(판을 고정 비율로 둔 이유가 무효화된다).
					transition: `background-color ${MORPH}, height ${MORPH}`,
				}}
			>
				{diagram ?? (
					<ClearSpaceFrame h={h} clearSpace={clearSpace}>
						<Composed
							lockup={lockup}
							h={h}
							color={color}
							symbolT={symbolT}
							symbolColors={symbolColors}
						/>
					</ClearSpaceFrame>
				)}
			</div>
			{/* 🔴 도판 모드에서는 락업이 판에 없다 — 내보낼 것이 없으므로 잠근다. */}
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					shape="sharp"
					disabled={Boolean(diagram)}
					onClick={() => void download(false)}
				>
					SVG — 로고만
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					shape="sharp"
					disabled={Boolean(diagram)}
					onClick={() => void download(true)}
				>
					SVG — 배경·판 크기 포함
				</Button>
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

/**
 * 클리어스페이스 프레임. 🔑 여백은 **로고 바운딩박스 사방 균일**이고(rules.ts `clearSpaceFor`),
 * 우리는 잉크로 트림해 두었으므로 안의 락업 박스가 곧 그 bbox다 — `padding`이 그대로 규정이 된다.
 *
 * 두 겹으로 보인다: 바깥 실선이 여백의 끝(누구도 넘어올 수 없는 선)이고, 안쪽 점선이 로고 bbox다.
 * 🔴 `clearSpace`가 0이면 테두리를 그리지 않지만 **자리는 그대로 차지한다** — 켜고 끌 때 락업이
 *    움직이면 여백이 아니라 로고가 변한 것처럼 보인다.
 */
function ClearSpaceFrame({
	h,
	clearSpace,
	children,
}: {
	h: number
	clearSpace: number
	children: React.ReactNode
}) {
	const on = clearSpace > 0
	// 🔑 미끄러지는 것은 **이 프레임**이다. 판 가운데에 놓이므로 안의 글자 폭이 바뀌면 자리가 바뀐다.
	// 🔴 `Composed`에 걸면 안 된다 — 이 프레임이 `position: relative`라 그쪽 `offsetLeft`는 항상
	//    padding 값으로 고정돼(offsetParent가 이 프레임이 된다) 움직임을 못 잡는다. 실제로 그렇게 깨졌다.
	const slideRef = useSlide()

	return (
		<div
			ref={slideRef}
			className="relative"
			style={{
				padding: h * clearSpace,
				// 🔴 `padding`에 전환을 걸지 않는다 — `useSlide`가 잉크 기준으로 이동을 이미 잇는데,
				//    padding까지 흐르면 같은 이동을 두 번 세서 락업이 옛 자리를 지나쳐 되돌아온다.
				transition: `outline-color ${MORPH}`,
				outline: '1px solid',
				outlineColor: on ? 'currentColor' : 'transparent',
				outlineOffset: -1,
			}}
		>
			{/* 안쪽 점선 = 로고 bbox. 여백이 무엇의 바깥인지 보이게 한다. */}
			<div
				className="pointer-events-none absolute border border-dashed"
				style={{
					inset: h * clearSpace,
					borderColor: on ? 'currentColor' : 'transparent',
					opacity: 0.45,
					transition: `inset ${MORPH}, border-color ${MORPH}`,
				}}
			/>
			{children}
		</div>
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

	return (
		<div
			data-lockup=""
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
				data-ink="bar"
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
export function CapLine({
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
						data-ink="text"
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

/* 🔑 모프 토큰은 `motion.ts`가 소유한다. 여기서 재수출하는 것은 기존 import 경로를 지키기 위함이다. */
export { easeMorph, type MORPH_EASING, MORPH_MS, reducedMotion }
