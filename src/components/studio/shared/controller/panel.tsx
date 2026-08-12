'use client'

import type * as React from 'react'
import { ControllerContent, ControllerFooter, ControllerRoot } from './layout'

type ControllerPanelProps = {
	/** 스크롤 영역 아래 고정되는 꼬리(설정·CTA). */
	footer?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/** 둥근 카드 패널 — 본문은 스크롤, footer는 하단 고정. */
export function ControllerPanel({ footer, className, children }: ControllerPanelProps) {
	return (
		<ControllerRoot data-slot="controller-panel" className={className}>
			<ControllerContent>{children}</ControllerContent>
			{footer && <ControllerFooter>{footer}</ControllerFooter>}
		</ControllerRoot>
	)
}
