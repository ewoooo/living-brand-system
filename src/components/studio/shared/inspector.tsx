'use client'

import { ChevronDown } from '@carbon/icons-react'
import type * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
	children: React.ReactNode
}

/** 접이식 섹션 — 상단 구분선 + 제목 행 + 행 스택. */
export function InspectorSection({ title, defaultOpen = true, children }: InspectorSectionProps) {
	return (
		<Collapsible
			data-slot="inspector-section"
			defaultOpen={defaultOpen}
			className="flex shrink-0 flex-col border-t border-border pt-1"
		>
			<CollapsibleTrigger className="group flex h-9 w-full items-center justify-between gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
				<span className="text-sm font-semibold text-muted-foreground">{title}</span>
				{/* 디자인 SSOT: 펼침 = ˅, 접힘 = ˃ (dialkit 폴더 캐럿). */}
				<ChevronDown
					aria-hidden
					className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
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
