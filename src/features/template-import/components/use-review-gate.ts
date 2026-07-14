'use client'

import { useSyncExternalStore } from 'react'

/**
 * 템플릿 편집 폼의 "검수 통과" 상태. 검수 버튼과 게시 버튼이 서로 다른 admin 슬롯에 mount되므로
 * 모듈 스토어로 공유한다. 문서 편집을 시작할 때(검수 버튼 mount)와 내용이 바뀔 때 false로 초기화한다.
 * ponytail: 세션 내 단일 문서 편집 기준의 클라 UX 게이트. 서버 강제는 아님(검수는 review feature가 소유, 지금은 스텁).
 */
let passed = false
const listeners = new Set<() => void>()

export function setReviewPassed(value: boolean) {
	if (passed === value) return
	passed = value
	for (const listener of listeners) listener()
}

export function useReviewPassed(): boolean {
	return useSyncExternalStore(
		(onChange) => {
			listeners.add(onChange)
			return () => listeners.delete(onChange)
		},
		() => passed,
		() => false,
	)
}
