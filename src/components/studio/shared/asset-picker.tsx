'use client'

import { Close } from '@carbon/icons-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

type AssetPickerRootProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	className?: string
	children: React.ReactNode
}

/**
 * 자산 피커 킷의 뿌리 — 열림 상태를 받고 패널의 위치 기준을 세운다.
 *
 * ui/dialog의 DialogContent는 스크림(DialogOverlay)과 화면 중앙 고정을 함께 소유해서 쓸 수 없다.
 * 여기서는 radix Dialog를 modal={false}로 직접 감싼다 — 스크림 없이 캔버스가 계속 보이고
 * 조작되면서도 Esc 닫기·role="dialog"·닫은 뒤 트리거로 포커스 복귀는 radix가 소유한다.
 */
function AssetPickerRoot({ open, onOpenChange, className, children }: AssetPickerRootProps) {
	return (
		<DialogPrimitive.Root modal={false} open={open} onOpenChange={onOpenChange}>
			{/* 패널은 트리거가 사는 컨트롤러 패널(overflow-hidden) 밖에서 이 상자를 기준으로 뜬다. */}
			<div data-slot="asset-picker" className={cn('relative h-full', className)}>
				{children}
			</div>
		</DialogPrimitive.Root>
	)
}

type AssetPickerPanelProps = {
	/** 탭 라벨 — 지금은 하나(Image Profiles)다. 전체가 패널의 접근 이름을 겸한다. */
	tabs: readonly string[]
	/** 본문이 비었을 때 그리드 아래 자리에 앉는 안내. */
	empty?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/**
 * 컨트롤러 왼쪽에 떠서 캔버스를 덮는 글래스 패널 — 도메인 무지: 무엇을 고르는 피커인지 모른다.
 * 소유하는 것은 글래스 크롬, 헤더(탭 + 닫기), 본문 영역, 빈 상태 자리뿐이다.
 *
 * 색: 테마와 무관하게 어두운 글래스를 의도한 디자인이지만 생 rgba를 쓰지 않는다(docs/09 §4).
 * 사이드바 헤더 카드의 선례대로 반전 표면 쌍(bg-foreground + text-background)을 쓰고 내부
 * 겹침은 background 투명도로 쌓는다 — 다크 테마에서는 쌍이 함께 뒤집혀 밝은 글래스가 된다.
 */
function AssetPickerPanel({ tabs, empty, className, children }: AssetPickerPanelProps) {
	return (
		<DialogPrimitive.Content
			data-slot="asset-picker-panel"
			// 설명 문단이 없다 — 비워두지 않으면 radix가 존재하지 않는 id를 가리킨다.
			aria-describedby={undefined}
			className={cn(
				// 상한은 top-5만큼 줄인 남은 높이다 — 100%로 두면 컨트롤러 아래로 20px 넘친다.
				'absolute top-5 right-0 z-20 flex h-168 max-h-[calc(100%-1.25rem)] w-150 max-w-[calc(100vw-2rem)] flex-col gap-1 overflow-hidden rounded-xl border border-background/5 bg-foreground/75 p-2 text-background shadow-lg outline-none backdrop-blur-sm lg:right-full lg:mr-4',
				className,
			)}
		>
			<div className="flex shrink-0 items-center justify-end gap-3 py-1 pr-2">
				<DialogPrimitive.Title className="flex h-8 min-w-0 flex-1 items-center overflow-hidden">
					{tabs.map((tab) => (
						<Typography
							key={tab}
							as="span"
							size="base"
							weight="medium"
							className="flex h-8 items-center justify-center rounded-md px-3"
						>
							{tab}
						</Typography>
					))}
				</DialogPrimitive.Title>
				<DialogPrimitive.Close asChild>
					<Button
						variant="ghost"
						size="icon"
						shape="pill"
						className="bg-background/5 text-background hover:bg-background/15 hover:text-background focus-visible:bg-background/15 focus-visible:text-background"
					>
						<Close />
						<span className="sr-only">자산 피커 닫기</span>
					</Button>
				</DialogPrimitive.Close>
			</div>
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl bg-background/5 py-2 pr-1 pl-2">
				{children}
				{empty && (
					<div className="flex items-center justify-center p-6">
						<Typography as="p" size="sm" className="text-center text-background/80">
							{empty}
						</Typography>
					</div>
				)}
			</div>
		</DialogPrimitive.Content>
	)
}

/**
 * 탭을 가진 재사용 가능한 자산 피커 — 지금 소비자는 이미지 프로파일 교체 하나이고,
 * 템플릿 배경의 프리셋 브라우즈가 같은 킷에 탭으로 얹힐 자리다.
 */
export const AssetPicker = {
	Root: AssetPickerRoot,
	Trigger: DialogTrigger,
	Panel: AssetPickerPanel,
}

export { AssetPickerPanel, AssetPickerRoot }
