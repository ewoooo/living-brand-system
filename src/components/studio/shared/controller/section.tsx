'use client'

import { ChevronDown } from '@carbon/icons-react'
import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type ControllerSectionProps = {
	title: string
	defaultOpen?: boolean
	/** 잠긴 섹션 — 강제로 닫히고 토글할 수 없다(예: 이미지 생성 전 Transform). 풀리면 저장된 열림 상태로 복귀. */
	disabled?: boolean
	className?: string
	children: React.ReactNode
}

/** 접이식 섹션 — 상단 구분선 + 제목 행 + 행 스택. */
export function ControllerSection({
	title,
	defaultOpen = true,
	disabled = false,
	className,
	children,
}: ControllerSectionProps) {
	// disabled 동안에도 사용자의 열림 의사를 보존한다 — 잠금이 풀리면 원래 상태로 돌아온다.
	const [open, setOpen] = React.useState(defaultOpen)

	return (
		<Collapsible
			data-slot="controller-section"
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
