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
	children: React.ReactNode
}

export function StudioWorkspace({ sidebar, children }: StudioWorkspaceProps) {
	return (
		// lg 행을 1fr로 못 박아야 컨트롤러가 길어져도 페이지 대신 패널 내부가 스크롤된다.
		<section
			data-slot="studio-workspace"
			className="grid min-h-0 lg:h-full lg:max-h-full lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden"
		>
			<aside
				data-slot="studio-workspace-sidebar"
				className="min-h-0 p-4 lg:order-2 lg:h-full lg:max-h-full lg:overflow-hidden"
			>
				{sidebar}
			</aside>
			<div
				data-slot="studio-workspace-canvas"
				className="flex min-h-96 min-w-0 flex-col p-4 md:p-6 lg:order-1 lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden"
			>
				{children}
			</div>
		</section>
	)
}
