import {
	CAP_TRIM,
	CLEAR_SPACE,
	FIDELITY_CAVEAT,
	fontSizeFor,
	LOCKUPS,
	type Lockup,
	MIN_SIZE,
	SYMBOL,
	TIER_LABEL,
} from './rules'

// CI 락업을 벡터가 아니라 **HTML로 조립한다**. 심볼(승인 아트워크)은 그대로 쓰고, 워드마크만
// HD체로 조판해 H비율 그리드에 얹는다. 배치 규칙이 전부 H의 배수라 CSS로 그대로 옮겨진다.
//
// 🔴 자간·행간을 손으로 맞추지 않는다(letter-spacing: normal). 정본과의 차이를 없애면
//    "폰트로 재현 가능한가"를 판정할 수 없다 — 그 판정이 이 위젯의 목적 중 하나다.
// 🔴 폭은 계산하지 않는다. HD체는 advance width가 균일하지 않고 커닝도 있어 규칙으로 못 낸다.
//    높이·간격만 규칙이 정하고 폭은 폰트 렌더에 맡긴다.

/** 워드마크 웨이트. 정본이 아웃라인이라 확정 불가 — 육안으로 가장 가까운 Bold를 쓴다. */
const WEIGHT = 700

export function CiLockupView({
	h,
	wordmarkColor,
	stageColor,
}: {
	h: number
	wordmarkColor: string
	stageColor: string
}) {
	const tiers = ['ci', 'subsidiary', 'overseas'] as const

	return (
		<div className="flex w-full flex-col gap-10">
			{tiers.map((tier) => {
				const items = LOCKUPS.filter((lockup) => lockup.tier === tier)
				return (
					<section key={tier} className="flex flex-col gap-4">
						<h3 className="font-body font-semibold text-foreground text-sm">
							{TIER_LABEL[tier]}
						</h3>
						{/* 🔴 1열이다. 가로형 영문은 폭이 심볼 높이의 7배에 가까워 2열에 넣으면 잘린다 —
							로고가 잘린 화면은 가이드라인으로 성립하지 않는다. */}
						<div className="grid gap-y-6">
							{items.map((lockup) => (
								<LockupFigure
									key={lockup.key}
									lockup={lockup}
									h={h}
									color={wordmarkColor}
									stage={stageColor}
								/>
							))}
						</div>
					</section>
				)
			})}

			<dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-muted-foreground text-xs">
				<div>
					<dt className="inline">H</dt> <dd className="inline">{h}px</dd>
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

			{/* 🔴 검토용이라는 사실을 화면에서 뗄 수 없게 붙여 둔다. */}
			<p className="font-body text-destructive text-xs">{FIDELITY_CAVEAT}</p>
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
	const assumed = lockup.lines.some((line) => line.assumed) || Boolean(lockup.note)

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
				<span className="font-mono text-muted-foreground text-xs">{lockup.source}</span>
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

	return (
		<div
			className={`flex ${horizontal ? 'flex-row items-center' : 'flex-col items-center'}`}
			style={{ gap: h * lockup.gap }}
		>
			{/* 심볼은 승인된 아트워크 그대로. 높이가 곧 H다. */}
			{/* biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image를 쓰지 않는다. */}
			<img
				src={SYMBOL.default}
				alt=""
				style={{ height: h, width: h * SYMBOL.aspect }}
				className="block shrink-0"
			/>

			{/* 🔴 flex gap이 아니라 줄마다의 marginTop이다 — 줄 사이 간격이 줄마다 다를 수 있다
				(영문은 HD–영문 간격과 영문 행 사이 간격이 다르다). */}
			<div
				className={`flex shrink-0 flex-col ${horizontal ? 'items-start' : 'items-center'}`}
				style={{ color }}
			>
				{lockup.lines.map((line, i) => (
					<CapLine
						key={line.text}
						text={line.text}
						cap={line.cap}
						h={h}
						gapBefore={i === 0 ? 0 : (line.gapBefore ?? lockup.lineGap)}
					/>
				))}
			</div>
		</div>
	)
}

/**
 * 한 줄을 **cap 높이가 정확히 `cap × H`가 되도록** 그린다.
 * 🔴 상자 높이가 cap과 같아야 그 위아래 간격(lineGap·gap)이 스펙대로 성립한다. font-size를 그대로
 *    쓰면 어센더·디센더 여백까지 상자에 포함돼 정본보다 벌어진다.
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
	/** 이 줄 위의 간격(H 배수). cap 트림과 한 marginTop에 합쳐진다. */
	gapBefore: number
}) {
	return (
		<span
			className="block whitespace-pre"
			style={{
				fontFamily: '"HD", var(--font-body)',
				fontWeight: WEIGHT,
				fontSize: fontSizeFor(cap, h),
				lineHeight: 1,
				// 자간은 건드리지 않는다 — 정본과의 차이가 보여야 판정이 된다.
				letterSpacing: 'normal',
				// 트림(em, 글자 크기 기준)과 간격(px, H 기준)은 단위가 달라 calc로 합친다.
				marginTop: `calc(${CAP_TRIM.top}em + ${h * gapBefore}px)`,
				marginBottom: `${CAP_TRIM.bottom}em`,
			}}
		>
			{text}
		</span>
	)
}

export default CiLockupView
