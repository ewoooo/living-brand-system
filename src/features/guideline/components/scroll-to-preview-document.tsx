'use client'

import { useEffect } from 'react'

/**
 * Preview 대상 문서 위치로 최초 렌더 시 한 번 이동한다.
 * URL #앵커와 scrollIntoView는 동일 출처 부모 프레임(admin)까지 스크롤시키므로,
 * iframe 안의 SectionLayout 스크롤 컨테이너만 직접 움직인다.
 */
export function ScrollToPreviewDocument({ targetId }: { targetId: string }) {
	useEffect(() => {
		const target = document.getElementById(targetId)
		const scrollContainer = target?.closest<HTMLElement>(
			'[data-slot="section-scroll-container"]',
		)
		if (!target || !scrollContainer) return

		scrollContainer.scrollTo({
			top:
				scrollContainer.scrollTop +
				target.getBoundingClientRect().top -
				scrollContainer.getBoundingClientRect().top,
		})
	}, [targetId])

	return null
}
