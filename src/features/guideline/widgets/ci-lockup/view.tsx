'use client'

import { useId, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { SPEC_READOUT } from '../readout'
import {
	bearingOf,
	branchLabel,
	CLEAR_SPACE,
	type Column,
	deriveLockups,
	FIDELITY_CAVEAT,
	FONT,
	fontSizeFor,
	type Lockup,
	MIN_SIZE,
	OVERSEAS_BRANCHES,
	partialColumnArea,
	SUBSIDIARIES,
	SYMBOL,
	splitScripts,
	TIER_LABEL,
	TIERS,
	type Tier,
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

/** H(심볼 높이). 워드마크가 읽히는 크기로 잡았다. */
const H = 100

export function CiLockupView({
	wordmarkColor,
	stageColor,
}: {
	wordmarkColor: string
	stageColor: string
}) {
	// 🔑 단계를 내려도 상위 선택을 지우지 않고 보관한다 — 다시 올리면 그대로 돌아온다.
	const [tier, setTier] = useState<Tier>('ci')
	const [subKo, setSubKo] = useState(SUBSIDIARIES[0].ko)
	const [branchKey, setBranchKey] = useState(branchLabel(OVERSEAS_BRANCHES[0]))
	const stepId = useId()

	const subsidiary = SUBSIDIARIES.find((s) => s.ko === subKo) ?? SUBSIDIARIES[0]
	const branch =
		OVERSEAS_BRANCHES.find((b) => branchLabel(b) === branchKey) ?? OVERSEAS_BRANCHES[0]
	const lockups = deriveLockups({ tier, subsidiary, branch })
	const step = TIERS.indexOf(tier) + 1

	return (
		<div className="flex w-full flex-col gap-8">
			<div className="grid gap-4 sm:grid-cols-3">
				<label className="flex flex-col gap-2" htmlFor={stepId}>
					<span className="font-body text-foreground text-sm">
						단계 {step} · {TIER_LABEL[tier]}
					</span>
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
				</label>

				<Field label="자회사" disabled={tier === 'ci'}>
					<Select value={subKo} onValueChange={setSubKo} disabled={tier === 'ci'}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SUBSIDIARIES.map((s) => (
								<SelectItem key={s.ko} value={s.ko}>
									HD{s.ko}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<Field label="해외지사" disabled={tier !== 'overseas'}>
					<Select
						value={branchKey}
						onValueChange={setBranchKey}
						disabled={tier !== 'overseas'}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{OVERSEAS_BRANCHES.map((b) => (
								<SelectItem key={branchLabel(b)} value={branchLabel(b)}>
									{branchLabel(b)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</div>

			{/* 🔴 1열이다. 가로형 영문은 폭이 심볼 높이의 7배에 가까워 2열에 넣으면 잘린다 —
				로고가 잘린 화면은 가이드라인으로 성립하지 않는다. */}
			<div className="grid gap-y-6">
				{lockups.map((lockup) => (
					<LockupFigure
						key={lockup.key}
						lockup={lockup}
						h={H}
						color={wordmarkColor}
						stage={stageColor}
					/>
				))}
			</div>

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

/** 컨트롤 이름표. 비활성일 때 이유가 보이게 흐리기만 하고 자리는 지킨다. */
function Field({
	label,
	disabled,
	children,
}: {
	label: string
	disabled: boolean
	children: React.ReactNode
}) {
	return (
		<div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
			<span className="font-body text-foreground text-sm">{label}</span>
			{children}
		</div>
	)
}

function LockupFigure({
	lockup,
	h,
	color,
	stage,
}: {
	lockup: Lockup
	h: number
	color: string
	stage: string
}) {
	const assumed =
		lockup.columns.some((column) => column.rows.some((row) => row.assumed)) ||
		Boolean(lockup.note)

	return (
		<figure className="flex flex-col gap-3">
			{/* 🔴 판은 밝아야 한다(기본형 Full Color는 밝은 배경 전용). 다크 모드에서도 마찬가지다.
				overflow-x-auto는 안전망이다 — 좁은 자리에서도 로고를 자르지 않고 흘려보낸다. */}
			<div
				className="flex items-center justify-center overflow-x-auto border border-border p-8"
				style={{ background: stage, minHeight: h * 2 }}
			>
				<Composed lockup={lockup} h={h} color={color} />
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
function Composed({ lockup, h, color }: { lockup: Lockup; h: number; color: string }) {
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
			className={`flex ${horizontal ? `flex-row ${baseTop === undefined ? 'items-center' : 'items-start'}` : 'flex-col items-center'}`}
			style={{ gap: h * lockup.gap }}
		>
			{/* 심볼은 승인된 아트워크 그대로. 높이가 곧 H다. */}
			{/* biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image를 쓰지 않는다. */}
			<img
				src={SYMBOL.default}
				alt=""
				style={{ height: h, width: h * SYMBOL.aspect, marginTop: baseTop }}
				className="block shrink-0"
			/>

			{/* 🔴 열 사이는 flex gap이 아니라 열마다의 marginLeft다 — 열마다 간격이 다를 수 있다. */}
			<div className="flex shrink-0 flex-row items-stretch" style={{ color }}>
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
