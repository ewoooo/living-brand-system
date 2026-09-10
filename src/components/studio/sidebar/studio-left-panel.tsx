'use client'

import type { ReactNode } from 'react'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

/**
 * 캔버스 왼쪽 패널의 공통 껍데기.
 *
 * 🔴 **레이아웃은 콘텐츠와 별개다**(사용자 지시, 2026-09-10). 그릴 것이 없어도 이 패널은
 *    자리를 지킨다 — 프로파일을 못 불러와도, 아직 아무 축도 선언하지 않았어도 화면 골격이
 *    바뀌지 않는다. 빈 자리는 패널을 지우는 대신 **패널 안에서** 말한다.
 * 🔑 좌측이 갖는 것: 페이지 선택(헤더) · 스타일 · 판 전체에 걸리는 컨트롤.
 *    우측이 갖는 것: 레이어(헤더) · 그 레이어의 컨트롤 · 내보내기(footer).
 */
export function StudioLeftPanel({
	header,
	empty,
	children,
}: {
	header?: ReactNode
	/** 그릴 것이 없을 때 패널 안에 세울 문구. 없으면 기본 문구를 쓴다. */
	empty?: { title: string; description?: string }
	children?: ReactNode
}) {
	return (
		<StudioSidebar header={header}>
			{children ?? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>
							{empty?.title ?? '이 화면에는 왼쪽 컨트롤이 없습니다'}
						</EmptyTitle>
						{empty?.description && (
							<EmptyDescription>{empty.description}</EmptyDescription>
						)}
					</EmptyHeader>
				</Empty>
			)}
		</StudioSidebar>
	)
}
