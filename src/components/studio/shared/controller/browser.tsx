'use client'

import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { ControllerPicker } from './picker'
import { useRowControl } from './row'

type ControllerBrowserProps = {
	/** 현재 값의 이름, 또는 아직 고르지 않았다면 고르라는 안내. */
	title: React.ReactNode
	/** 자산의 출처(Brand Image 등). 있으면 제목이 한 단계 작아진다 — 두 카드의 실측 형태다. */
	subtitle?: React.ReactNode
	/** 열기 버튼 라벨(Change·Browse). */
	buttonLabel: string
	/** 버튼의 접근 가능한 이름 — 라벨만으로는 무엇을 여는지 알 수 없다. */
	'aria-label': string
	/** 패널 헤더의 탭 라벨 — 전체가 패널의 접근 이름을 겸한다. */
	tabs?: readonly string[]
	/** 본문이 비었을 때의 안내. */
	empty?: React.ReactNode
	/** 배선 전 컨트롤 — 잠기면 트리거 자체를 두지 않아 패널이 존재하지 않는다.
	 *  Row 안에서는 행의 disabled를 자동으로 따른다. */
	disabled?: boolean
	className?: string
	/** 패널 본문 — 무엇을 고르는지는 도메인(소비자)이 그린다. */
	children?: React.ReactNode
}

/**
 * 자산 카드 — 현재 값과 피커를 여는 버튼이 한 줄에 앉는 컨트롤러 파츠(docs/10 §3.6의 asset kind).
 * 열림 상태는 Controller.Picker가 소유하므로 소비자는 아무 state도 들지 않고, 고른 뒤 닫기는
 * 본문이 Controller.Picker.Close로 감싸 처리한다.
 *
 * 패널은 컨트롤러 패널 밖으로 떠야 하므로 Controller.Picker.Root가 화면 컨트롤러를 감싸고 있어야
 * 한다 — 잠긴 카드(배선 전 스테이징)는 열 것이 없으니 Root 없이도 홀로 그려진다.
 */
export function ControllerBrowser({
	title,
	subtitle,
	buttonLabel,
	'aria-label': ariaLabel,
	tabs,
	empty,
	disabled,
	className,
	children,
}: ControllerBrowserProps) {
	const row = useRowControl()
	const locked = disabled || row?.disabled

	const button = (
		<Button
			type="button"
			variant="muted"
			size="sm"
			aria-label={ariaLabel}
			disabled={locked}
			className="h-auto shrink-0 rounded-lg bg-background/25 px-2.5 py-1 text-background text-xs hover:bg-background/35"
		>
			{buttonLabel}
		</Button>
	)

	return (
		<div
			data-slot="controller-browser"
			className={cn(
				'flex min-h-16 shrink-0 items-center justify-between gap-3 rounded-md bg-foreground p-4 text-background',
				className,
			)}
		>
			<div className="flex min-w-0 flex-col">
				<Typography
					as="p"
					size={subtitle ? 'sm' : 'base'}
					weight="medium"
					className="truncate"
				>
					{title}
				</Typography>
				{subtitle && (
					<Typography as="p" size="xs" className="truncate text-background/60">
						{subtitle}
					</Typography>
				)}
			</div>
			{locked ? (
				button
			) : (
				<>
					<ControllerPicker.Trigger asChild>{button}</ControllerPicker.Trigger>
					<ControllerPicker.Panel tabs={tabs ?? []} empty={empty}>
						{children}
					</ControllerPicker.Panel>
				</>
			)}
		</div>
	)
}
