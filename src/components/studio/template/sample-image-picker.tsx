'use client'

import { useEffect } from 'react'
import { ControllerBrowser } from '@/components/shared/controller'
import { browseEmptyMessage } from '@/components/studio/shared/browse-status'
import { Typography } from '@/components/ui/typography'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import type { SampleImageOption } from '@/features/template-customization/services/list-sample-images.client'
import { cn } from '@/lib/utils'

/**
 * 자산 브라우저 본문의 샘플 이미지 카드 그리드 — 킷(Controller.Browser)이 크롬을, 이 컴포넌트가 도메인을 갖는다.
 * 배경과 이미지 슬롯이 같은 목록을 쓰므로 고른 뒤 무엇을 하는지는 onSelect가 갖는다.
 * 고른 뒤 닫기는 카드를 감싼 Controller.Browser.Close가 받는다 — 열림 상태는 킷이 소유한다.
 */
export function SampleImagePicker({
	selectedId,
	onSelect,
}: {
	selectedId?: number
	onSelect: (option: SampleImageOption) => void
}) {
	const { sampleImages } = useTemplateStudio()
	const { load } = sampleImages
	// 이 컴포넌트는 패널이 열릴 때 마운트된다(radix가 닫힌 콘텐츠를 언마운트한다) — mount가 곧 "열림"이다.
	// 실패했다면 다시 열 때 재시도된다.
	useEffect(() => {
		load()
	}, [load])

	// 목록이 언제 오는지는 이 컴포넌트만 안다 — 빈 자리 안내도 여기가 갖는다(부모는 목록을 모른다).
	const empty = browseEmptyMessage(
		sampleImages.status,
		(sampleImages.data?.length ?? 0) > 0,
		'고를 수 있는 샘플 이미지가 없습니다.',
	)
	if (empty) {
		return (
			<Typography as="p" size="sm" className="px-1 py-2">
				{empty}
			</Typography>
		)
	}

	return (
		<div data-slot="sample-image-picker" className="grid shrink-0 grid-cols-3 gap-3 pr-1">
			{(sampleImages.data ?? []).map((option) => {
				const current = option.id === selectedId

				return (
					<ControllerBrowser.Close key={option.id} asChild>
						<button
							type="button"
							// 브라우저는 현재 선택을 보여야 한다 — 테두리 두께와 aria-current로 함께 알린다.
							aria-current={current || undefined}
							onClick={() => onSelect(option)}
							className={cn(
								'flex h-48 flex-col overflow-hidden rounded-lg border bg-background/5 text-left outline-none focus-visible:ring-2 focus-visible:ring-background/50',
								current
									? 'border-2 border-background/60'
									: 'border-background/10 hover:bg-background/10',
							)}
						>
							<ControllerBrowser.Thumbnail
								image={{ url: option.thumbnailUrl, alt: option.alt }}
							/>
							<div className="flex shrink-0 flex-col bg-background/5 px-1.5 py-2">
								<Typography as="p" size="xs" weight="medium" className="truncate">
									{option.name}
								</Typography>
							</div>
						</button>
					</ControllerBrowser.Close>
				)
			})}
		</div>
	)
}
