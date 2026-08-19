'use client'

import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { StudioPreviewImage } from '@/modules/studio-controller/controller-definition'
import { ControllerBrowser } from './browser'
import { useRowControl } from './row'

type ControllerAssetCardProps = {
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
	/** 현재 자산의 미리보기 이미지. 있으면 카드 배경이 되고, 없으면 지금의 단색 표면 그대로다. */
	previewImage?: StudioPreviewImage
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
 * 자산 카드 — 현재 값과 자산 브라우저를 여는 버튼이 한 줄에 앉는 컨트롤러 파츠(docs/10 §3.6의 asset kind).
 * 열림 상태는 Controller.Browser가 소유하므로 소비자는 아무 state도 들지 않고, 고른 뒤 닫기는
 * 본문이 Controller.Browser.Close로 감싸 처리한다.
 *
 * 패널은 컨트롤러 패널 밖으로 떠야 하므로 Controller.Browser.Root가 화면 컨트롤러를 감싸고 있어야
 * 한다 — 잠긴 카드(배선 전 스테이징)는 열 것이 없으니 Root 없이도 홀로 그려진다.
 */
export function ControllerAssetCard({
	title,
	subtitle,
	buttonLabel,
	'aria-label': ariaLabel,
	tabs,
	previewImage,
	empty,
	disabled,
	className,
	children,
}: ControllerAssetCardProps) {
	const row = useRowControl()
	const locked = disabled || row?.disabled

	const button = (
		<Button
			type="button"
			variant="muted"
			size="sm"
			aria-label={ariaLabel}
			disabled={locked}
			className="h-auto shrink-0 rounded-lg bg-inverted-foreground/25 px-2.5 py-1 text-inverted-foreground text-xs hover:bg-inverted-foreground/35"
		>
			{buttonLabel}
		</Button>
	)

	return (
		<div
			data-slot="controller-asset-card"
			className={cn(
				'relative isolate flex min-h-16 shrink-0 items-center justify-between gap-3 overflow-hidden rounded-lg bg-inverted p-4 text-inverted-foreground',
				className,
			)}
		>
			{previewImage && (
				// 배경은 장식이므로 alt를 비운다 — 카드가 무엇인지는 제목이 이미 말한다.
				// 그 위에 어두운 막을 깔아 이미지가 어떻든 제목·버튼의 대비가 유지된다(docs/08).
				<>
					{/* biome-ignore lint/performance/noImgElement: 업로드 URL은 next/image 최적화 대상이 아니다 */}
					<img
						src={previewImage.url}
						alt=""
						aria-hidden="true"
						className="-z-10 absolute inset-0 size-full object-cover"
					/>
					<div aria-hidden="true" className="-z-10 absolute inset-0 bg-inverted/60" />
				</>
			)}
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
					<Typography as="p" size="xs" className="truncate text-inverted-foreground/60">
						{subtitle}
					</Typography>
				)}
			</div>
			{locked ? (
				button
			) : (
				<>
					<ControllerBrowser.Trigger asChild>{button}</ControllerBrowser.Trigger>
					<ControllerBrowser.Panel tabs={tabs ?? []} empty={empty}>
						{children}
					</ControllerBrowser.Panel>
				</>
			)}
		</div>
	)
}
