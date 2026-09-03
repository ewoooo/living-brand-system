import type React from 'react'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'

type StudioWorkspacePageProps = {
	title: string
	description?: string
	/** 디자인 SSOT에서 제목이 컨트롤러(아이덴티티 카드)로 옮겨간 화면은 헤딩을 스크린리더 전용으로 숨긴다. */
	hideHeading?: boolean
	children: React.ReactNode
}

/** Studio 도구의 제목과 작업 영역이 화면 높이를 공유하는 공통 페이지 프레임. */
export function StudioWorkspacePage({
	title,
	description,
	hideHeading = false,
	children,
}: StudioWorkspacePageProps) {
	return (
		<ContentFrame
			data-slot="studio-workspace-page"
			variant="full"
			// 앱 셸의 남은 grid 행을 채운다. 컴팩트 헤더가 펼쳐져도 같은 행 안에서 함께 줄어든다.
			// sr-only 헤딩은 absolute라 grid 행을 차지하지 않는다 — 숨김이면 본문 단일 행으로 구성한다.
			className={`grid h-full min-h-0 py-0 ${
				hideHeading ? 'grid-rows-[minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)]'
			}`}
		>
			<ContentHeading
				title={title}
				description={description}
				className={hideHeading ? 'sr-only' : 'px-4 py-6 md:px-8'}
			/>
			{children}
		</ContentFrame>
	)
}

type StudioWorkspaceProps = {
	sidebar: React.ReactNode
	/** 캔버스 왼쪽 패널 — 창작자가 실제로 다루는 큰 축(색 조합·형태)이 앉는 자리. */
	leftPanel?: React.ReactNode
	children: React.ReactNode
}

export function StudioWorkspace({ sidebar, leftPanel, children }: StudioWorkspaceProps) {
	return (
		// lg 행을 1fr로 못 박아야 컨트롤러가 길어져도 페이지 대신 패널 내부가 스크롤된다.
		// 사이드바 열은 auto다 — 기본 폭(lg:w-80)은 StudioSidebar가 갖고, Review처럼 패널이
		// 둘로 늘어나는 화면은 사이드바 쪽이 넓어지고 캔버스가 줄어든다(디자인 78:2706).
		<section
			data-slot="studio-workspace"
			className={`grid min-h-0 lg:h-full lg:max-h-full lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden ${
				leftPanel
					? 'lg:grid-cols-[auto_minmax(0,1fr)_auto]'
					: 'lg:grid-cols-[minmax(0,1fr)_auto]'
			}`}
		>
			{/*
			 * 🔴 overflow를 잠그지 않는다 — 자산 브라우저 패널이 컨트롤러 왼쪽(캔버스 위)으로
			 * 나가야 하는데, 여기서 자르면 패널이 통째로 안 보여 트리거가 죽은 것처럼 보인다.
			 * 컨트롤러 자체 스크롤은 Controller.Root의 overflow-hidden이 이미 갖고 있다.
			 */}
			<aside
				data-slot="studio-workspace-sidebar"
				className="min-h-0 p-4 lg:order-3 lg:h-full lg:max-h-full"
			>
				{sidebar}
			</aside>
			<div
				data-slot="studio-workspace-canvas"
				className="flex min-h-96 min-w-0 flex-col p-4 md:p-6 lg:order-2 lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden"
			>
				{children}
			</div>
			{/* DOM에서는 캔버스 뒤에 온다 — 좁은 화면에서 이 패널이 캔버스를 밀어내고 맨 위에 서지 않게. */}
			{leftPanel && (
				<aside
					data-slot="studio-workspace-left-panel"
					className="min-h-0 p-4 lg:order-1 lg:h-full lg:max-h-full"
				>
					{leftPanel}
				</aside>
			)}
		</section>
	)
}
