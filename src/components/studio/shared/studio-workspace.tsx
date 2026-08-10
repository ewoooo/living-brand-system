import type React from 'react'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'

type StudioWorkspacePageProps = {
	title: string
	description?: string
	children: React.ReactNode
}

/** Studio 도구의 제목과 작업 영역이 화면 높이를 공유하는 공통 페이지 프레임. */
export function StudioWorkspacePage({ title, description, children }: StudioWorkspacePageProps) {
	return (
		<ContentFrame
			data-slot="studio-workspace-page"
			variant="full"
			className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] py-0"
		>
			<ContentHeading title={title} description={description} className="px-4 py-6 md:px-8" />
			{children}
		</ContentFrame>
	)
}

type StudioWorkspaceProps = {
	controller: React.ReactNode
	children: React.ReactNode
}

/** Studio 도구의 컨트롤러와 결과 캔버스 배치만 소유한다. */
export function StudioWorkspace({ controller, children }: StudioWorkspaceProps) {
	return (
		<section
			data-slot="studio-workspace"
			className="grid min-h-0 border-t border-border lg:grid-cols-[22rem_minmax(0,1fr)]"
		>
			<aside
				data-slot="studio-workspace-controller"
				className="min-h-0 p-4 lg:border-r lg:border-border"
			>
				{controller}
			</aside>
			<div
				data-slot="studio-workspace-canvas"
				className="flex min-h-96 min-w-0 flex-col bg-muted/20 p-4 md:p-6 lg:min-h-0"
			>
				{children}
			</div>
		</section>
	)
}
