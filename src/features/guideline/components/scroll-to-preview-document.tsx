'use client'

import { useEffect } from 'react'

/**
 * Preview 대상 문서 위치로 최초 렌더 시 한 번 이동한다.
 * URL #앵커와 scrollIntoView는 동일 출처 부모 프레임(admin)까지 스크롤시키므로,
 * 자기 창만 움직이는 window.scrollTo를 쓴다.
 */
export function ScrollToPreviewDocument({ targetId }: { targetId: string }) {
	useEffect(() => {
		const target = document.getElementById(targetId)
		if (!target) return

		window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY })
	}, [targetId])

	return null
}
