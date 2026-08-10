'use client'

import { ChevronDown } from '@carbon/icons-react'
import { AnimatePresence, domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/**
 * Studio 컨트롤러 인스펙터 킷 — 디자인 SSOT(Figma HD_LBS_UI 1:14)의 dialkit 기반
 * 패널 언어(36px 행·muted 채움·접이식 섹션)를 Creator UI 토큰으로 옮긴 조합.
 * 템플릿 컨트롤러가 첫 소비자이고, 나머지 스튜디오 화면 컨트롤러가 같은 킷을 쓴다.
 *
 * 컨트롤러 API 공통 상태 계약(Figma 4:5578 Controller API):
 * - label: 텍스트 또는 아이콘 노드 — 아이콘 라벨은 접근 가능한 이름(sr-only 텍스트)을 반드시 동반한다.
 * - disabled: 어드민이 고정해 조정 불가 — 행 전체가 흐려지고 조작이 막힌다(opacity-50 관례).
 * - readonly: 값은 정상 대비로 보이되 컨트롤·chevron을 그리지 않는 조합 — 별도 prop 없이 구성으로 표현한다.
 * - isEmpty: 아직 사용자가 값을 정하지 않음 — 원본 값을 사칭하지 않고 —로 보인다.
 * - maxStringLength: InspectorField의 counter(n/max)로 표시한다.
 */

/** 행 안에 투명하게 앉는 셀렉트 트리거 공통 클래스 — 인스펙터 행 언어의 일부라 여기서 소유한다. */
export const INSPECTOR_ROW_SELECT_TRIGGER =
	'h-auto border-transparent bg-transparent p-0 text-muted-foreground focus-visible:ring-0 dark:bg-transparent'

/** InspectorRow/Field 안에 투명하게 앉는 입력 공통 클래스 — 포커스 링은 행이 소유한다. */
export const INSPECTOR_BARE_INPUT =
	'h-auto min-h-0 rounded-none border-0 bg-transparent p-0 focus-visible:ring-0 dark:bg-transparent'

type InspectorPanelProps = {
	/** 스크롤 영역 아래 고정되는 꼬리(설정·CTA). */
	footer?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/** 둥근 카드 패널 — 본문은 스크롤, footer는 하단 고정. */
export function InspectorPanel({ footer, className, children }: InspectorPanelProps) {
	return (
		<div
			data-slot="inspector-panel"
			className={cn(
				'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg lg:h-full',
				className,
			)}
		>
			<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
			{footer && (
				<div className="flex shrink-0 flex-col gap-4 border-t border-border px-4 pt-1 pb-4">
					{footer}
				</div>
			)}
		</div>
	)
}

type InspectorSectionProps = {
	title: string
	defaultOpen?: boolean
	/** 잠긴 섹션 — 강제로 닫히고 토글할 수 없다(예: 이미지 생성 전 Transform). 풀리면 저장된 열림 상태로 복귀. */
	disabled?: boolean
	className?: string
	children: React.ReactNode
}

/** 접이식 섹션 — 상단 구분선 + 제목 행 + 행 스택. */
export function InspectorSection({
	title,
	defaultOpen = true,
	disabled = false,
	className,
	children,
}: InspectorSectionProps) {
	// disabled 동안에도 사용자의 열림 의사를 보존한다 — 잠금이 풀리면 원래 상태로 돌아온다.
	const [open, setOpen] = React.useState(defaultOpen)

	return (
		<Collapsible
			data-slot="inspector-section"
			open={disabled ? false : open}
			onOpenChange={setOpen}
			disabled={disabled}
			className={cn('flex shrink-0 flex-col border-t border-border pt-1', className)}
		>
			<CollapsibleTrigger className="group flex h-9 w-full items-center justify-between gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50">
				<span className="text-sm font-semibold text-muted-foreground">{title}</span>
				{/* 디자인 SSOT(2:2071): 펼침 = ˅, 접힘 = ˄. */}
				<ChevronDown
					aria-hidden
					className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:rotate-180"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-1">{children}</CollapsibleContent>
		</Collapsible>
	)
}

type InspectorRowProps = React.ComponentProps<'div'> & {
	label: React.ReactNode
	/** 행 안의 입력 컨트롤 id — 라벨 클릭이 컨트롤로 연결된다. */
	htmlFor?: string
	/** 어드민이 고정해 조정 불가한 행(디자인의 Admin Fixed) — 행 전체가 흐려지고 포인터가 막힌다.
	 *  키보드 포커스는 내부 컨트롤의 disabled가 막는다 — 같은 값을 컨트롤에도 전달할 것. */
	disabled?: boolean
}

/** 한 줄 행 — 왼쪽 라벨, 오른쪽 값/컨트롤. dialkit의 36px 행 대응. */
export function InspectorRow({
	label,
	htmlFor,
	disabled,
	className,
	children,
	...props
}: InspectorRowProps) {
	// 연결할 컨트롤 id가 없으면 label을 쓰지 않는다 — 아무것도 가리키지 않는 label은 클릭이 죽은 거짓 어포던스다.
	const LabelTag = htmlFor ? 'label' : 'span'
	return (
		<div
			data-slot="inspector-row"
			aria-disabled={disabled || undefined}
			className={cn(
				'flex h-9 w-full shrink-0 items-center justify-between gap-3 rounded-md bg-muted px-3 focus-within:ring-2 focus-within:ring-ring/30',
				disabled && 'pointer-events-none opacity-50',
				className,
			)}
			{...props}
		>
			<LabelTag htmlFor={htmlFor} className="shrink-0 text-sm text-muted-foreground">
				{label}
			</LabelTag>
			{children}
		</div>
	)
}

type InspectorSegmentedProps<T extends string> = {
	options: readonly { value: T; label: string }[]
	value: T
	onChange: (value: T) => void
	'aria-label': string
	/** 어드민 고정 값 — 포커스·조작이 막힌다. 행의 disabled와 함께 쓴다. */
	disabled?: boolean
}

/**
 * 세그먼트 토글(Preset|Generate, Off|On) — dialkit segmented 구조를 그대로 옮겼다:
 * 트랙(relative) 위에 투명 버튼들이 놓이고, 선택 배경은 별도의 pill 하나가
 * 활성 버튼 위치로 미끄러진다(dialkit-segmented-pill). 트랙은 행의 오른끝에서
 * 2px 인셋으로 앉는다(-mr-2.5 = 행 패딩 12px − 2px).
 */
export function InspectorSegmented<T extends string>({
	options,
	value,
	onChange,
	'aria-label': ariaLabel,
	disabled,
}: InspectorSegmentedProps<T>) {
	const trackRef = React.useRef<HTMLDivElement>(null)
	const [pill, setPill] = React.useState<{ left: number; width: number } | null>(null)
	const reducedMotion = useReducedMotion()

	// pill은 활성 버튼의 실측 위치를 따라간다 — 버튼 폭이 라벨마다 달라 CSS만으로는 못 놓는다.
	// ponytail: 측정은 value 변경 시점뿐 — 폰트 로드로 폭이 미세하게 변하면 다음 전환에서 맞춰진다.
	// biome-ignore lint/correctness/useExhaustiveDependencies(value): 측정 대상 DOM(data-state=on)이 value로 그려진다
	React.useLayoutEffect(() => {
		const active = trackRef.current?.querySelector<HTMLElement>('[data-state="on"]')
		if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth })
	}, [value])

	return (
		<div ref={trackRef} className="-mr-2.5 relative flex h-9 shrink-0 items-center py-0.5">
			{pill && (
				<LazyMotion features={domAnimation}>
					{/* dialkit segmented pill — 활성 탭으로 스프링 이동. */}
					<m.div
						aria-hidden
						className="absolute inset-y-0.5 rounded-sm bg-foreground/10"
						initial={false}
						animate={{ left: pill.left, width: pill.width }}
						transition={
							reducedMotion
								? { duration: 0 }
								: { type: 'spring', visualDuration: 0.2, bounce: 0.15 }
						}
					/>
				</LazyMotion>
			)}
			<ToggleGroup
				type="single"
				value={value}
				// 세그먼트는 항상 하나가 선택돼 있다 — 같은 칩 재클릭(빈 값)은 무시.
				onValueChange={(next) => next && onChange(next as T)}
				aria-label={ariaLabel}
				disabled={disabled}
				spacing={0}
				className="relative h-full"
			>
				{options.map((option) => (
					<ToggleGroupItem
						key={option.value}
						value={option.value}
						size="sm"
						className="h-full rounded-sm bg-transparent px-2 text-muted-foreground text-sm transition-colors hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground"
					>
						{option.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	)
}

type InspectorTabPanelProps = {
	/** 활성 탭 식별자 — 바뀔 때마다 이전 콘텐츠가 빠지고 새 콘텐츠가 들어온다. */
	tabKey: string
	className?: string
	children: React.ReactNode
}

/**
 * 세그먼트(탭) 전환에 따르는 콘텐츠 스왑 — dialkit 드롭다운 전환(fade + y + scale)을 옮겼다.
 * mode="wait"라 이전 콘텐츠가 빠진 뒤 새 콘텐츠가 들어와 높이가 겹치지 않는다.
 */
export function InspectorTabPanel({ tabKey, className, children }: InspectorTabPanelProps) {
	const reducedMotion = useReducedMotion()

	return (
		<LazyMotion features={domAnimation}>
			<AnimatePresence mode="wait" initial={false}>
				<m.div
					key={tabKey}
					data-slot="inspector-tab-panel"
					className={cn('flex flex-col gap-1', className)}
					initial={reducedMotion ? false : { opacity: 0, y: 4, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={
						reducedMotion
							? undefined
							: { opacity: 0, y: 4, scale: 0.97, pointerEvents: 'none' }
					}
					transition={{ duration: 0.15, ease: 'easeOut' }}
				>
					{children}
				</m.div>
			</AnimatePresence>
		</LazyMotion>
	)
}

type InspectorColorRowProps = {
	label: string
	/** hex 색상 데이터(#rrggbb). 스타일이 아니라 props로 흐르는 데이터다(docs/09 §4 예외). */
	value: string
	onChange?: (hex: string) => void
	/** 아직 사용자가 정하지 않은 상태 — hex 대신 —를 보여 원본 값을 사칭하지 않는다. */
	isEmpty?: boolean
	/** 값이 정해진 뒤 원본으로 되돌리는 어포던스. isEmpty가 아닐 때만 그려진다. */
	onReset?: () => void
	disabled?: boolean
	className?: string
}

/** 색상 행 — hex 표기 + 네이티브 컬러 피커 스와치. */
export function InspectorColorRow({
	label,
	value,
	onChange,
	isEmpty = false,
	onReset,
	disabled,
	className,
}: InspectorColorRowProps) {
	const inputId = React.useId()
	return (
		// 라벨 클릭이 피커를 열도록 행 라벨을 input에 연결한다 — 가시 라벨이 곧 접근 가능한 이름.
		<InspectorRow label={label} htmlFor={inputId} className={className}>
			<span className="flex shrink-0 items-center gap-2">
				{!isEmpty && onReset && (
					<button
						type="button"
						aria-label={`${label} 원래 색으로 되돌리기`}
						onClick={onReset}
						className="rounded-sm text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
					>
						초기화
					</button>
				)}
				<span className="font-mono text-sm text-muted-foreground lowercase">
					{isEmpty ? '—' : value}
				</span>
				<input
					id={inputId}
					type="color"
					aria-label={`${label} 색상 선택`}
					value={value}
					disabled={disabled}
					onChange={(event) => onChange?.(event.target.value)}
					className={cn(
						'size-5 shrink-0 cursor-pointer appearance-none rounded-sm border border-border bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch]:rounded-[inherit] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0',
						// 미설정 스와치는 비워 보인다 — 검정을 사칭하지 않기 위해서다.
						isEmpty && 'opacity-30',
					)}
				/>
			</span>
		</InspectorRow>
	)
}

type InspectorFieldProps = React.ComponentProps<'div'> & {
	label: React.ReactNode
	htmlFor?: string
	/** 라벨 행 오른끝의 카운터(디자인의 190/250) — maxStringLength 계약의 표시부. */
	counter?: string
}

/** 여러 줄 필드 — 라벨 위, 컨트롤 아래로 쌓이는 행. */
export function InspectorField({
	label,
	htmlFor,
	counter,
	className,
	children,
	...props
}: InspectorFieldProps) {
	const LabelTag = htmlFor ? 'label' : 'span'
	return (
		<div
			data-slot="inspector-field"
			className={cn(
				'flex w-full shrink-0 flex-col gap-1.5 rounded-md bg-muted px-3 pt-2 pb-3 focus-within:ring-2 focus-within:ring-ring/30',
				className,
			)}
			{...props}
		>
			<span className="flex items-baseline justify-between gap-3">
				<LabelTag htmlFor={htmlFor} className="text-sm text-muted-foreground">
					{label}
				</LabelTag>
				{counter && (
					<span className="shrink-0 font-mono text-muted-foreground text-xs">
						{counter}
					</span>
				)}
			</span>
			{children}
		</div>
	)
}

type InspectorCameraAxis = {
	/** 축 라벨(X·Y) — 셀렉트의 접근 가능한 이름이 된다. */
	label: string
	options: readonly { value: string; label: string }[]
	value: string
	onChange: (value: string) => void
}

type InspectorCameraControlProps = {
	/** 3D 오빗 프리뷰(ImageCameraOrbitControl 등) — 정사각 컨테이너에 담긴다. */
	children: React.ReactNode
	/** 프리뷰 아래 반폭으로 나란히 앉는 축 셀렉트들. */
	axes: readonly InspectorCameraAxis[]
}

/**
 * 카메라 컨트롤(디자인 4:5858) — 정사각 프리뷰 + 반폭 축 셀렉트 스택.
 * 프리뷰 렌더러(three.js 오빗)는 소비자가 children으로 넣는다 — 킷은 배치 언어만 소유한다.
 */
export function InspectorCameraControl({ children, axes }: InspectorCameraControlProps) {
	const id = React.useId()
	return (
		<div data-slot="inspector-camera-control" className="flex flex-col gap-1.5">
			<div className="aspect-square w-full shrink-0 overflow-hidden rounded-md bg-muted">
				{children}
			</div>
			<div className="grid grid-cols-2 gap-1.5">
				{axes.map((axis) => (
					<InspectorRow
						key={axis.label}
						label={axis.label}
						htmlFor={`${id}-${axis.label}`}
					>
						<Select value={axis.value} onValueChange={axis.onChange}>
							<SelectTrigger
								id={`${id}-${axis.label}`}
								size="sm"
								className={INSPECTOR_ROW_SELECT_TRIGGER}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{axis.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</InspectorRow>
				))}
			</div>
		</div>
	)
}
