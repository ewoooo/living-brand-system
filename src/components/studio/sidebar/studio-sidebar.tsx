'use client'

import type * as React from 'react'
import {
	ControllerContent,
	ControllerFooter,
	ControllerRoot,
} from '@/components/studio/shared/controller'

type StudioSidebarProps = {
	/** 스크롤 영역 아래 고정되는 설정·실행 영역. */
	footer?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/** Studio 사이드바의 공통 패널 껍데기 — 본문은 스크롤되고 footer는 하단에 고정된다. */
export function StudioSidebar({ footer, className, children }: StudioSidebarProps) {
	return (
		<ControllerRoot data-slot="studio-sidebar" className={className}>
			<ControllerContent>{children}</ControllerContent>
			{footer && <ControllerFooter>{footer}</ControllerFooter>}
		</ControllerRoot>
	)
}
