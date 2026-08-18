'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SPEC_READOUT } from '../readout'
import { CI_STAGE_DARK, CI_STAGE_LIGHT } from '../surface'
import { LockupDiagram } from './diagram'
import { easeMorph, MORPH, MORPH_EASING, MORPH_MS, reducedMotion } from './motion'
import {
	bearingOf,
	branchLabel,
	CLEAR_SPACE,
	CLEAR_SPACE_MODE_LABEL,
	CLEAR_SPACE_MODES,
	type ClearSpaceMode,
	COLOR_TYPE_LABEL,
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

/**
 * 통합 CI 위젯. 🔑 화면에는 **락업 하나**만 있고 컨트롤이 그것을 갈아끼운다 — 미리 정한 목록을
 * 나열하지 않는다. 단계가 계층을, 꼴·언어가 형태를, 색상 표현이 색과 판을 고른다.
 */
export function CiLockupView({ colors }: { colors: Record<string, string> }) {
	// 🔑 축을 내려도 상위 선택을 지우지 않고 보관한다 — 다시 올리면 그대로 돌아온다.
	// 🔑 **단계는 컨트롤이 아니라 파생값이다.** 「본사」는 고르는 항목이 아니라 *아무것도 켜지 않은
	//    상태*이므로 축에서 뺐다. 계열사를 켜면 자회사 CI가 되고 지사까지 켜면 해외지사 CI가 된다 —
	//    누적 계단이 켜기 두 개로 그대로 표현된다(rules.ts `overseasLockups`가 둘을 다 쓴다).
	const [subOn, setSubOn] = useState(false)
	const [branchOn, setBranchOn] = useState(false)
	const [form, setForm] = useState('horizontal')
	const [language, setLanguage] = useState<Language>('ko')
	const [subKo, setSubKo] = useState(SUBSIDIARIES[0].ko)
	const [branchKey, setBranchKey] = useState(branchLabel(OVERSEAS_BRANCHES[0]))
	const [colorType, setColorType] = useState<ColorType>('fullColor')
	const [mono, setMono] = useState<MonoColor>('BLACK')
	const [clearSpaceMode, setClearSpaceMode] = useState<ClearSpaceMode>('off')
	/** 치수 도판. 🔴 규정을 **보여주기만** 한다 — 간격은 조정 대상이 아니다(금지규정 #9). */
	const [measured, setMeasured] = useState(false)

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
	const stage = stageTone(colorType, mono) === 'dark' ? CI_STAGE_DARK : CI_STAGE_LIGHT
	const clearSpace = clearSpaceFor(lockup.orientation, clearSpaceMode)

	// 🔑 색을 고르는 것이 곧 단색형을 고르는 것이다 — 목록에서 색을 집으면 표현까지 따라 켜진다.
	//    그래서 「단색형을 누르고 그다음 색을 고르는」 두 단계가 없다.
	const pickMono = (next: string) => {
		setMono(next as MonoColor)
		setColorType('mono')
	}

	return (
		<div className="flex w-full flex-col gap-8">
			{/* 🔑 컨트롤을 **성격으로** 가른다 — 위는 「어떤 락업인가」(정체), 아래는 「어떻게 그리나」(표시).
				평평한 그리드 하나에 흘리면 클리어스페이스가 자회사 옆에 오는 식으로 성격이 섞여
				읽는 사람이 매번 분류부터 해야 한다. 선 하나가 그 분류를 대신한다. */}
			<div className="flex flex-col gap-4">
				{/* 🔑 계층을 고르는 컨트롤과 그 계층의 내용을 정하는 컨트롤을 **하나로 합쳤다.**
					켜기가 계층을 올리고, 같은 줄의 목록이 그 계층의 내용을 정한다. 목록은 떠서 열리므로
					(Radix Select = portal) 접혀 있을 때 자리를 먹지 않고, 접힌 상태에서도 **현재 값이
					줄 위에 그대로 적혀 있다.** 그래서 축 3개(단계·자회사·해외지사)가 줄 2개가 된다. */}
				<div className="flex flex-col gap-2">
					<EntityRow
						name="자회사"
						on={subOn}
						onToggle={setSubOn}
						value={subKo}
						onChange={setSubKo}
						items={SUBSIDIARIES.map((sub) => ({
							value: sub.ko,
							label: `HD${sub.ko}`,
						}))}
					/>
					{/* 🔴 자회사가 꺼져 있으면 켤 수 없다 — 지사명은 자회사명 위에 붙는다. */}
					<EntityRow
						name="해외지사"
						on={branchOn}
						onToggle={setBranchOn}
						disabled={!subOn}
						value={branchKey}
						onChange={setBranchKey}
						items={OVERSEAS_BRANCHES.map((b) => ({
							value: branchLabel(b),
							label: branchLabel(b),
						}))}
					/>
				</div>

				<div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
					{/* 🔑 슬롯은 **항상 두 개**다(가로형·세로형). 계층이 가로형A·B를 가질 때 버튼이
						2개→3개로 늘지 않고 가로형 슬롯 안이 캡슐로 갈린다 — 계층을 올릴 때 컨트롤의
						칸 수가 바뀌면 같은 자리를 누르던 손이 매번 다시 조준해야 한다. */}
					<Field label="꼴">
						<SlotChoice
							slots={formSlots(options.forms)}
							value={activeForm}
							onChange={setForm}
							label="락업 꼴"
						/>
					</Field>

					{/* 🔴 선택지가 하나뿐이면(해외지사 = 영문 전용) 그리지 않는다 — 고를 수 없는
						컨트롤은 자리만 먹는다. 그 사실은 판 밑 readout의 「락업」 줄이 말한다. */}
					{options.languages.length > 1 ? (
						<Field label="언어">
							<SlotChoice
								slots={options.languages.map((l) => ({
									key: l.key,
									label: l.label,
								}))}
								value={activeLanguage}
								onChange={(v) => setLanguage(v as Language)}
								label="워드마크 언어"
							/>
						</Field>
					) : null}
				</div>
			</div>

			<Separator />

			<div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
				{/* 🔑 세 표현은 **같은 위계**라 슬롯 셋이 같은 실루엣·같은 폭을 갖는다. 단색형만
					자기 칸 안에 **현재 색을 적은 목록**을 달아 색을 품는다 — 계열사 줄과 **같은 어휘**다
					(이름 + 현재값 드롭다운). 색이 둘뿐이어도 목록으로 두면 칸 폭을 색 개수가 정하지
					않으므로 색이 늘어도 슬롯 모양이 바뀌지 않는다. */}
				<Field label="색상 표현">
					<SlotChoice
						slots={COLOR_TYPES.map((t) =>
							t === 'mono'
								? {
										key: t,
										label: COLOR_TYPE_LABEL[t],
										trailing: (
											<Picker
												value={mono}
												onChange={pickMono}
												label="단색형 색상"
												items={MONO_COLORS.map((c) => ({
													value: c,
													label: c,
												}))}
											/>
										),
									}
								: { key: t, label: COLOR_TYPE_LABEL[t] },
						)}
						value={colorType}
						onChange={(v) => setColorType(v as ColorType)}
						label="색상 표현"
					/>
				</Field>

				{/* 🔑 도판은 **간격 규정**을 보여준다 — 여백(클리어스페이스)과 아예 다른 규정이고
					여기서 조정되지 않는다(금지규정 #9 「CI의 간격을 임의로 조정할 수 없습니다」).
					그래서 값 축이 아니라 표시 축이다. */}
				<Field label="치수">
					<SlotChoice
						slots={[
							{ key: 'off', label: '숨김' },
							{ key: 'on', label: '표시' },
						]}
						value={measured ? 'on' : 'off'}
						onChange={(v) => setMeasured(v === 'on')}
						label="치수 도판"
					/>
				</Field>

				{/* 🔴 `예외`는 공간 제약이 있을 때만 허용되는 값이다 — 더 좁게 써도 된다는 뜻이 아니다. */}
				<Field label={`클리어스페이스${clearSpace ? ` ${clearSpace}H` : ''}`}>
					<SlotChoice
						slots={CLEAR_SPACE_MODES.map((m) => ({
							key: m,
							label: CLEAR_SPACE_MODE_LABEL[m],
						}))}
						value={clearSpaceMode}
						onChange={(v) => setClearSpaceMode(v as ClearSpaceMode)}
						label="클리어스페이스"
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
				clearSpace={clearSpace}
				diagram={
					measured ? (
						<LockupDiagram
							lockup={lockup}
							siblings={all}
							h={H}
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
type Slot =
	| { key: string; label: string; trailing?: React.ReactNode }
	| { cap: string; halves: { key: string; label: string }[] }

/**
 * 슬롯 전환기. 🔑 **모든 슬롯이 같은 폭·같은 실루엣**을 갖고, 하위 선택이 있는 슬롯만 안쪽이 갈린다.
 *
 * 🔴 버튼 안에 버튼을 넣지 않는다 — 갈라진 두 반쪽은 같은 라디오 그룹의 **형제**다. 위계는 시각적
 *    묶음만으로 말하고 포커스 모델은 평평하게 남는다. 그래서 Radix의 roving tabindex가 그대로
 *    성립한다(중첩 div를 넘어 항목이 수집되는 것을 브라우저에서 실측 확인했다).
 * 🔴 캡슐 안 두 반쪽은 붙어야 하므로 모서리를 직접 정한다 — 그룹의 `spacing`이 0일 때만 도는
 *    toggle-group의 규칙(안쪽 모서리 각지게)이 여기선 걸리지 않기 때문이다.
 */
function SlotChoice({
	slots,
	value,
	onChange,
	label,
}: {
	slots: Slot[]
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
			// 🔴 flex로는 슬롯 폭이 균일해지지 않는다 — 기본 `min-width: auto`가 내용이 긴 항목을
			//    균등 배분 위로 밀어올려 캡슐만 좁아진다(실측 194/194/178). grid 트랙을
			//    `minmax(0, 1fr)`(= `auto-cols-fr`)로 못 박으면 내용과 무관하게 칸이 같아진다.
			//    자식에 `min-w-0`이 함께 있어야 긴 라벨이 트랙을 다시 늘리지 않는다.
			className="grid w-full auto-cols-fr grid-flow-col"
		>
			{slots.map((slot) =>
				'halves' in slot ? (
					<div key={slot.cap} className="flex min-w-0 items-center gap-1">
						<span className="shrink-0 font-body text-muted-foreground text-xs">
							{slot.cap}
						</span>
						{slot.halves.map((half, index) => (
							<ToggleGroupItem
								key={half.key}
								value={half.key}
								className={`min-w-0 flex-1 rounded-none ${
									index === 0 ? 'rounded-l-md' : ''
								} ${index === slot.halves.length - 1 ? 'rounded-r-md' : ''}`}
							>
								{half.label}
							</ToggleGroupItem>
						))}
					</div>
				) : slot.trailing ? (
					// 🔴 목록 트리거는 그룹 **항목이 아니다** — 버튼 안에 버튼을 넣지 않으려고 형제로
					//    둔다. 그래서 화살표는 항목만 돌고 목록에는 Tab으로 닿는다.
					<div key={slot.key} className="flex min-w-0 items-center gap-1">
						<ToggleGroupItem value={slot.key} className="shrink-0">
							{slot.label}
						</ToggleGroupItem>
						<div className="min-w-0 flex-1">{slot.trailing}</div>
					</div>
				) : (
					<ToggleGroupItem key={slot.key} value={slot.key} className="min-w-0">
						{slot.label}
					</ToggleGroupItem>
				),
			)}
		</ToggleGroup>
	)
}

/**
 * 꼴 슬롯. 🔑 가로형A·B를 **가로형 하나로 합쳐** 슬롯 수를 계층과 무관하게 둘로 고정한다.
 * 본사는 가로형이 하나뿐이라 갈리지 않고, 그 아래 계층에서만 캡슐로 갈린다.
 */
function formSlots(forms: { key: string; label: string }[]): Slot[] {
	const horizontal = forms.filter((f) => f.key.startsWith('horizontal'))
	const rest = forms.filter((f) => !f.key.startsWith('horizontal'))
	const horizontalSlot: Slot =
		horizontal.length > 1
			? {
					cap: '가로형',
					// 라벨이 `가로형A`라 캡과 겹친다 — 캡슐 안에서는 갈래만 남긴다.
					halves: horizontal.map((f) => ({
						key: f.key,
						label: f.label.replace('가로형', ''),
					})),
				}
			: { key: horizontal[0].key, label: horizontal[0].label }
	return [horizontalSlot, ...rest.map((f) => ({ key: f.key, label: f.label }))]
}

/**
 * 계층 한 칸. 🔑 **켜기와 내용 고르기를 한 줄로 합친다** — 켜기가 계층을 올리고 목록이 그 계층의
 * 내용을 정한다. 접혀 있어도 현재 값이 줄에 적혀 있고, 목록은 떠서 열려 자리를 먹지 않는다.
 */
function EntityRow({
	name,
	on,
	onToggle,
	disabled,
	value,
	onChange,
	items,
}: {
	name: string
	on: boolean
	onToggle: (next: boolean) => void
	disabled?: boolean
	value: string
	onChange: (next: string) => void
	items: { value: string; label: string }[]
}) {
	// 자회사가 꺼져 있으면 켜기 자체가 잠긴다. 켜지지 않은 줄은 목록도 고를 수 없다.
	const listDisabled = disabled || !on
	return (
		<div className="flex items-center gap-3 border border-border px-3 py-2">
			<Switch
				checked={on && !disabled}
				onCheckedChange={onToggle}
				disabled={disabled}
				aria-label={`${name} 켜기`}
			/>
			<span
				className={`font-body text-sm ${listDisabled ? 'text-muted-foreground' : 'text-foreground'}`}
			>
				{name}
			</span>
			<div className="min-w-0 flex-1">
				<Picker
					value={value}
					onChange={onChange}
					label={name}
					disabled={listDisabled}
					items={items}
				/>
			</div>
		</div>
	)
}

/** 선택지가 많을 때 쓰는 목록. 색은 스와치를 함께 보여 준다. */
function Picker({
	value,
	onChange,
	items,
	label,
	disabled,
}: {
	value: string
	onChange: (next: string) => void
	items: { value: string; label: string; swatch?: string }[]
	label: string
	disabled?: boolean
}) {
	return (
		<Select value={value} onValueChange={onChange} disabled={disabled}>
			<SelectTrigger className="w-full" aria-label={label}>
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

/**
 * 컨트롤 이름표.
 * 🔴 비활성 자리를 흐려서 남겨 두지 않는다 — 고를 수 없는 컨트롤은 자리만 먹는다.
 *    쓸 수 없는 축은 아예 그리지 않고(호출부의 조건 렌더), 그 사실은 readout이 말한다.
 */
function Field({
	label,
	className,
	children,
}: {
	label: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<div className={`flex flex-col gap-2 ${className ?? ''}`}>
			{/* 🔴 `<label>`이 아니라 텍스트다 — 이 이름표는 컨트롤 **하나**를 가리키지 않는다
				(색상 표현은 항목이 넷이고 계열사 줄은 Select가 둘이다). 접근성 이름은 각 컨트롤이
				자기 `aria-label`로 갖는다. */}
			<span className="font-body text-foreground text-sm">{label}</span>
			{children}
		</div>
	)
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
				transition: `padding ${MORPH}, outline-color ${MORPH}`,
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
export { easeMorph, MORPH_EASING, MORPH_MS, reducedMotion }
