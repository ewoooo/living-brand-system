'use client'

import type { DragEvent } from 'react'
import { Controller } from '@/components/shared/controller'
import { CheckVerdictStatus } from '@/components/studio/review/result/check-verdict-status'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import { getCheckScenario } from '@/features/quality-rule/check-scenario'

/**
 * 검수 대상 파일 목록 — 컨트롤러 패널의 첫 화면.
 * 행 = { 시나리오 이름, 파일 이름, 종합 판정 }. 판정은 표시만 하고 누를 수 없다.
 * 비어 있으면 이 자리가 드롭존이다(캔버스가 아니라 목록이 파일을 받는다).
 * 디자인 SSOT: Figma HD_LBS_UI 59:2945(Idle) · 56:2366(List).
 *
 * 이 파일은 이미지를 킷 어휘로 옮기는 일만 한다 — 행·타일의 시각은 Controller.ListRow/Status가 갖는다.
 */
export function ReviewFileList({ onOpen }: { onOpen: (id: string) => void }) {
	const { images, scenarios, selectedId, select, addFiles } = useCheckImages()

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
							<Controller.ListRow
								caption={
									scenarios.length > 0 && image.scenarioKey
										? getCheckScenario(scenarios, image.scenarioKey).title
										: '시나리오 없음'
								}
								label={image.name}
								selected={image.id === selectedId}
								trailing={<CheckVerdictStatus image={image} />}
								onClick={() => {
									select(image.id)
									onOpen(image.id)
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</Controller.Group>
	)
}
