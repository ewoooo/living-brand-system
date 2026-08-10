'use client'

import { ChevronDown } from '@carbon/icons-react'
import type * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/**
 * Studio 컨트롤러 인스펙터 킷 — 디자인 SSOT(Figma HD_LBS_UI 1:14)의 dialkit 기반
 * 패널 언어(36px 행·muted 채움·접이식 섹션)를 Creator UI 토큰으로 옮긴 조합.
 * 템플릿 컨트롤러가 첫 소비자이고, 나머지 스튜디오 화면 컨트롤러가 같은 킷을 쓴다.
 */

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
	className?: string
	children: React.ReactNode
}

/** 접이식 섹션 — 상단 구분선 + 제목 행 + 행 스택. */
export function InspectorSection({
	title,
	defaultOpen = true,
	className,
	children,
}: InspectorSectionProps) {
	return (
		<Collapsible
			data-slot="inspector-section"
			defaultOpen={defaultOpen}
			className={cn('flex shrink-0 flex-col border-t border-border pt-1', className)}
		>
			<CollapsibleTrigger className="group flex h-9 w-full items-center justify-between gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
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
}

/** 한 줄 행 — 왼쪽 라벨, 오른쪽 값/컨트롤. dialkit의 36px 행 대응. */
export function InspectorRow({ label, htmlFor, className, children, ...props }: InspectorRowProps) {
	return (
		<div
			data-slot="inspector-row"
			className={cn(
				'flex h-9 w-full shrink-0 items-center justify-between gap-3 rounded-md bg-muted px-3 focus-within:ring-2 focus-within:ring-ring/30',
				className,
			)}
			{...props}
		>
			<label htmlFor={htmlFor} className="shrink-0 text-sm text-muted-foreground">
				{label}
			</label>
			{children}
		</div>
	)
}

type InspectorSegmentedProps<T extends string> = {
	options: readonly { value: T; label: string }[]
	value: T
	onChange: (value: T) => void
	'aria-label': string
}

/** 세그먼트 토글 — 행 오른쪽에 놓이는 칩 묶음(Preset|Generate, Off|On). 선택 칩은 어두운 면. */
export function InspectorSegmented<T extends string>({
	options,
	value,
	onChange,
	'aria-label': ariaLabel,
}: InspectorSegmentedProps<T>) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			// 세그먼트는 항상 하나가 선택돼 있다 — 같은 칩 재클릭(빈 값)은 무시.
			onValueChange={(next) => next && onChange(next as T)}
			aria-label={ariaLabel}
			spacing={1}
			className="shrink-0"
		>
			{options.map((option) => (
				<ToggleGroupItem
					key={option.value}
					value={option.value}
					size="sm"
					className="h-6 rounded-md px-2.5 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
				>
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	)
}

type InspectorColorRowProps = {
	label: string
	/** hex 색상 데이터(#rrggbb). 스타일이 아니라 props로 흐르는 데이터다(docs/09 §4 예외). */
	value: string
	onChange?: (hex: string) => void
	disabled?: boolean
	className?: string
}

/** 색상 행 — hex 표기 + 네이티브 컬러 피커 스와치. */
export function InspectorColorRow({
	label,
	value,
	onChange,
	disabled,
	className,
}: InspectorColorRowProps) {
	return (
		<InspectorRow label={label} className={className}>
			<span className="flex shrink-0 items-center gap-2">
				<span className="font-mono text-sm text-muted-foreground lowercase">{value}</span>
				<input
					type="color"
					aria-label={`${label} 색상 선택`}
					value={value}
					disabled={disabled}
					onChange={(event) => onChange?.(event.target.value)}
					className="size-5 shrink-0 cursor-pointer appearance-none rounded-sm border border-border bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch]:rounded-[inherit] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
				/>
			</span>
		</InspectorRow>
	)
}

type InspectorFieldProps = React.ComponentProps<'div'> & {
	label: React.ReactNode
	htmlFor?: string
}

/** 여러 줄 필드 — 라벨 위, 컨트롤 아래로 쌓이는 행. */
export function InspectorField({
	label,
	htmlFor,
	className,
	children,
	...props
}: InspectorFieldProps) {
	return (
		<div
			data-slot="inspector-field"
			className={cn(
				'flex w-full shrink-0 flex-col gap-1.5 rounded-md bg-muted px-3 pt-2 pb-3 focus-within:ring-2 focus-within:ring-ring/30',
				className,
			)}
			{...props}
		>
			<label htmlFor={htmlFor} className="text-sm text-muted-foreground">
				{label}
			</label>
			{children}
		</div>
	)
}
