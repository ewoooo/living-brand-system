'use client'

import type { DragEvent } from 'react'
import { CHECK_STATUS, CHECK_VERDICT_ICON } from '@/components/studio/review/result/check-status'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import type { CheckImage } from '@/features/asset-check/types'
import {
	type CheckImageVerdict,
	checkImageVerdict,
} from '@/features/asset-check/utils/check-image-verdict'
import { getCheckScenario } from '@/features/quality-rule/check-scenario'

/**
 * 검수 대상 파일 목록 — 컨트롤러 패널의 첫 화면.
 * 행 = { 시나리오 이름, 파일 이름, 종합 판정 }. 판정은 표시만 하고 누를 수 없다.
 * 비어 있으면 이 자리가 드롭존이다(캔버스가 아니라 목록이 파일을 받는다).
 * 디자인 SSOT: Figma HD_LBS_UI 59:2945(Idle) · 56:2366(List).
 */
export function ReviewFileList({ onOpen }: { onOpen: (id: string) => void }) {
	const { images, scenarios, selectedId, select, addFiles } = useCheckImages()

	function handleDrop(event: DragEvent<HTMLElement>) {
		event.preventDefault()
		addFiles(event.dataTransfer.files)
	}

	if (images.length === 0) {
		return (
			<section
				data-slot="review-file-list"
				aria-label="검수할 이미지 업로드"
				className="flex h-full items-center justify-center"
				onDragOver={(event) => event.preventDefault()}
				onDrop={handleDrop}
			>
				<Empty className="gap-2">
					<EmptyTitle>Drag &amp; Drop</EmptyTitle>
					<EmptyDescription>검수할 이미지를 여기에 놓으세요</EmptyDescription>
				</Empty>
			</section>
		)
	}

	return (
		<ul
			data-slot="review-file-list"
			className="flex flex-col gap-2 py-2"
			onDragOver={(event) => event.preventDefault()}
			onDrop={handleDrop}
		>
			{images.map((image) => (
				<li key={image.id}>
					<ReviewFileRow
						image={image}
						scenarioTitle={
							scenarios.length > 0 && image.scenarioKey
								? getCheckScenario(scenarios, image.scenarioKey).title
								: null
						}
						selected={image.id === selectedId}
						onOpen={() => {
							select(image.id)
							onOpen(image.id)
						}}
					/>
				</li>
			))}
		</ul>
	)
}

function ReviewFileRow({
	image,
	scenarioTitle,
	selected,
	onOpen,
}: {
	image: CheckImage
	scenarioTitle: string | null
	selected: boolean
	onOpen: () => void
}) {
	const verdict = checkImageVerdict(image)

	return (
		<button
			type="button"
			data-slot="review-file-row"
			data-selected={selected || undefined}
			onClick={onOpen}
			className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none data-[selected]:border-foreground/30 data-[selected]:bg-muted"
		>
			<span className="flex min-w-0 flex-1 flex-col">
				<Typography as="span" size="xs" tone="muted" className="truncate">
					{scenarioTitle ?? '시나리오 없음'}
				</Typography>
				<Typography as="span" size="sm" weight="medium" className="truncate">
					{image.name}
				</Typography>
			</span>
			<ReviewFileVerdict verdict={verdict} />
		</button>
	)
}

/** 종합 판정 표시 — 버튼이 아니다. 아이콘만으로는 읽히지 않으므로 라벨을 함께 싣는다. */
function ReviewFileVerdict({ verdict }: { verdict: CheckImageVerdict }) {
	if (verdict === 'idle') return null
	if (verdict === 'running') {
		return <Spinner className="size-4 text-muted-foreground" aria-label="검수 중" />
	}
	if (verdict === 'failed') {
		return (
			<Badge variant="muted" shape="rounded">
				검사 실패
			</Badge>
		)
	}

	const status = CHECK_STATUS[verdict]
	const Icon = CHECK_VERDICT_ICON[verdict]

	return (
		<Badge variant={status.variant} shape="rounded" aria-label={status.label}>
			<Icon aria-hidden data-icon="only" />
		</Badge>
	)
}
