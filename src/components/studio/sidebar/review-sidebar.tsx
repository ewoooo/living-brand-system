'use client'

import { ChevronLeft } from '@carbon/icons-react'
import { useState } from 'react'
import { ReviewFileList } from '@/components/studio/review/review-file-list'
import { ReviewSummary } from '@/components/studio/review/review-summary'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'

/**
 * 검수 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 목록 ↔ 요약 드릴다운만 여기서 소유하고, 파일·판정·실행은 전부 CheckImageProvider가 갖는다.
 * 제목은 Controller.Header가 아니라 본문 안에 둔다 — 디자인의 패널은 제목 아래 구분선이 없다.
 * 디자인 SSOT: Figma HD_LBS_UI section 56:2 "Review Usecase".
 */
export function ReviewSidebar({ sections }: { sections: CheckSection[] }) {
	// 어느 화면을 보고 있는지는 편집 세션이 아니라 이 패널의 표현 상태다.
	const [view, setView] = useState<'list' | 'summary'>('list')
	const { images, scenarios, selected, selectedId, runCheck, runAllChecks } = useCheckImages()
	const busy = images.some((image) => image.status === 'running')
	// 발행된 시나리오가 없으면 실행할 룰이 없다 — 눌리고도 아무 일이 없는 버튼을 만들지 않는다.
	const ready = scenarios.length > 0 && !busy
	const summaryOpen = view === 'summary' && selected !== null

	return (
		<StudioSidebar
			footer={
				<div className="flex flex-col gap-2">
					{scenarios.length === 0 && (
						<Typography as="p" size="xs" tone="muted">
							발행된 검수 시나리오가 없습니다
						</Typography>
					)}
					<div className="flex gap-2">
						<Button
							type="button"
							variant="highlight"
							className="h-11 flex-1"
							disabled={!selectedId || !ready}
							onClick={runCheck}
						>
							{/* 진행은 목록 행의 스피너가 알린다 — 버튼 이름에 "Loading"이 섞이지 않게 숨긴다. */}
							{busy ? <Spinner aria-hidden /> : null}
							검사
						</Button>
						<Button
							type="button"
							variant="muted"
							className="h-11 flex-1"
							disabled={images.length === 0 || !ready}
							onClick={runAllChecks}
						>
							전부 검사
						</Button>
					</div>
				</div>
			}
		>
			<div className="flex h-9 shrink-0 items-center pt-1">
				{summaryOpen ? (
					<button
						type="button"
						onClick={() => setView('list')}
						className="-mx-1 flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
					>
						<ChevronLeft aria-hidden />
						<Typography as="span" size="sm" weight="semibold" className="truncate">
							{selected.name}
						</Typography>
						<span className="sr-only">목록으로 돌아가기</span>
					</button>
				) : (
					<Typography as="h2" size="sm" weight="semibold">
						List
					</Typography>
				)}
			</div>
			{summaryOpen ? (
				<ReviewSummary sections={sections} />
			) : (
				<ReviewFileList onOpen={() => setView('summary')} />
			)}
		</StudioSidebar>
	)
}
