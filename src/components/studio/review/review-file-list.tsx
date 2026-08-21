'use client'

import type { DragEvent } from 'react'
import { Controller } from '@/components/shared/controller'
import { ReviewCard } from '@/components/studio/review/review-card'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 검수 대상 파일 목록 — 컨트롤러 패널의 첫 화면.
 * 행 = { 시나리오 이름, 파일 이름, 종합 판정 또는 시나리오 셀렉트 }.
 * 비어 있으면 이 자리가 드롭존이다(캔버스가 아니라 목록이 파일을 받는다).
 * 디자인 SSOT: Figma HD_LBS_UI 59:2945(Idle) · 56:2366(List).
 *
 * 이 파일은 목록과 드롭만 갖는다 — 행 하나의 시각·상호작용은 ReviewCard가 소유한다.
 */
export function ReviewFileList({ onOpen }: { onOpen: (id: string) => void }) {
	const { images, scenarios, selectedId, select, addFiles, setScenarioKey } = useCheckImages()

	function handleDrop(event: DragEvent<HTMLElement>) {
		event.preventDefault()
		addFiles(event.dataTransfer.files)
	}

	return (
		<Controller.Group
			collapsible={false}
			title="List"
			data-slot="review-file-list"
			// 빈 목록도 파일을 받는다 — 드롭존이 캔버스가 아니라 이 자리다.
			className={images.length === 0 ? 'flex-1' : undefined}
			onDragOver={(event) => event.preventDefault()}
			onDrop={handleDrop}
		>
			{images.length === 0 ? (
				<Empty className="flex-1 gap-2">
					<EmptyTitle>Drag &amp; Drop</EmptyTitle>
					<EmptyDescription>PNG, JPEG, WebP</EmptyDescription>
				</Empty>
			) : (
				<ul className="flex flex-col gap-1">
					{images.map((image) => (
						<li key={image.id}>
							<ReviewCard
								image={image}
								scenarios={scenarios}
								selected={image.id === selectedId}
								onOpen={() => {
									select(image.id)
									onOpen(image.id)
								}}
								onScenarioChange={(scenarioKey) =>
									setScenarioKey(scenarioKey, image.id)
								}
							/>
						</li>
					))}
				</ul>
			)}
		</Controller.Group>
	)
}
