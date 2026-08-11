'use client'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { useImageStudio } from '@/features/image-studio/hooks/use-image-studio'
import type { ImageStudioProfileOption } from '@/features/image-studio/image-studio-config'
import { cn } from '@/lib/utils'

/**
 * 배지는 장식이 아니라 그 프로파일이 무엇을 열어주는지의 표시다 — 계약의 개방 필드에서만 파생한다.
 * 새 필드를 만들지 않으므로 어드민이 개방을 바꾸면 배지가 따라 바뀐다.
 */
function profileBadges(option: ImageStudioProfileOption): string[] {
	return [
		...(option.supportsCameraControl ? ['Camera'] : []),
		...(option.colorAdjustment ? ['Line Control'] : []),
	]
}

type ImageProfilePickerProps = {
	/** 고른 뒤 패널을 닫는다 — 열림 상태는 사이드바가 소유한다. */
	onPicked: () => void
}

/**
 * 자산 피커 본문의 이미지 프로파일 카드 그리드 — 킷(AssetPicker)이 크롬을, 이 컴포넌트가 도메인을 갖는다.
 * 컨텍스트의 교체 후보와 현재 계약만 읽고, 카드를 고르면 프로파일을 교체하고 패널을 닫는다.
 * 디자인 SSOT: Figma HD_LBS_UI node 19:12907.
 */
export function ImageProfilePicker({ onPicked }: ImageProfilePickerProps) {
	const { config, profiles } = useImageStudio()

	return (
		<div data-slot="image-profile-picker" className="grid shrink-0 grid-cols-3 gap-3 pr-1">
			{profiles.options.map((option) => {
				const current = option.profileId === config.profileId

				return (
					<button
						key={option.profileId}
						type="button"
						// 피커는 현재 선택을 보여야 한다 — 테두리 두께와 aria-current로 함께 알린다.
						aria-current={current || undefined}
						onClick={() => {
							profiles.select(option.profileId)
							onPicked()
						}}
						className={cn(
							'flex h-64 flex-col overflow-hidden rounded-lg border bg-background/5 text-left outline-none focus-visible:ring-2 focus-visible:ring-background/50',
							current
								? 'border-2 border-background/60'
								: 'border-background/10 hover:bg-background/10',
						)}
					>
						{/* 썸네일 자리 — 프로파일에는 대표 이미지 원천이 없다(보고: 생성 이미지는 사용자 세션에서 프로파일별로 조회되지 않는다). */}
						<div className="min-h-0 flex-1 bg-background/20" />
						<div className="flex shrink-0 flex-col gap-2 bg-background/5 px-1.5 py-2">
							<Typography as="p" size="xs" weight="medium" className="truncate">
								{option.name}
							</Typography>
							{/* 배지가 없어도 자리 높이를 유지한다 — 카드마다 이름 위치가 흔들리지 않는다. */}
							<div className="flex h-5 items-center gap-0.5">
								{profileBadges(option).map((badge) => (
									<Badge key={badge} variant="muted" shape="rounded">
										{badge}
									</Badge>
								))}
							</div>
						</div>
					</button>
				)
			})}
		</div>
	)
}
