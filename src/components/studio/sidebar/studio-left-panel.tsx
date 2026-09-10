'use client'

import type { ReactNode } from 'react'
import {
	StudioPanel,
	StudioPanelFixed,
	StudioPanelScroll,
} from '@/components/studio/sidebar/studio-panel'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

/**
 * 캔버스 왼쪽 패널 — 위 블록 하나에 **페이지 선택**과 **공통된 것**이 함께 들어간다
 * (사용자 지시, 2026-09-10). 우측의 「레이어 + 컨트롤러」와 같은 자리다.
 *
 * 🔴 **레이아웃은 콘텐츠와 별개다.** 그릴 것이 없어도 패널은 자리를 지킨다 — 프로파일을 못
 *    불러와도, 아직 아무 축도 선언하지 않았어도 화면 골격이 바뀌지 않는다. 빈 자리는 패널을
 *    지우는 대신 **패널 안에서** 말한다.
 * 🔑 좌측이 갖는 것: 페이지 선택 · 스타일 · 판 전체에 걸리는 공통 컨트롤.
 *    우측이 갖는 것: 레이어 · 그 레이어의 컨트롤 · settings + 내보내기.
 */
export function StudioLeftPanel({
	page,
	empty,
	bottom,
	children,
}: {
	/** 페이지(템플릿·프로파일) 선택 — 블록 맨 위에 고정된다. */
	page?: ReactNode
	/** 공통된 것이 없을 때 패널 안에 세울 문구. */
	empty?: { title: string; description?: string }
	/** 아래 블록. 우측의 「settings + 내보내기」와 같은 자리이고 아직 비어 있다. */
	bottom?: ReactNode
	/** 공통된 것 — 판 전체에 걸리는 컨트롤. */
	children?: ReactNode
}) {
	return (
		<StudioPanel
			slot="studio-left-panel"
			top={
				<>
					{page && <StudioPanelFixed>{page}</StudioPanelFixed>}
					<StudioPanelScroll>
						{children ?? (
							<Empty>
								<EmptyHeader>
									<EmptyTitle>
										{empty?.title ?? '이 화면에는 공통 컨트롤이 없습니다'}
									</EmptyTitle>
									{empty?.description && (
										<EmptyDescription>{empty.description}</EmptyDescription>
									)}
								</EmptyHeader>
							</Empty>
						)}
					</StudioPanelScroll>
				</>
			}
			bottom={bottom}
		/>
	)
}
