'use client'

import { Button, toast, useFormModified } from '@payloadcms/ui'
import { useEffect } from 'react'
import { setReviewPassed, useReviewPassed } from '../hooks/use-review-gate'

/**
 * 저장 컨트롤 옆(beforeDocumentControls)의 [검수] 버튼.
 * 검수 자체는 review feature가 소유하며 아직 미완성이라, 지금은 누르면 항상 통과 처리하는 스텁이다.
 * 검수 통과는 (검수통과 && 수정사항 없음)일 때만 [변경사항 게시]를 여는 게이트로 쓰인다(review-gated-publish-button).
 */
export default function ReviewGateButton() {
	const modified = useFormModified()
	const passed = useReviewPassed()

	// 이 문서 편집 세션 시작·종료 시 검수 상태 초기화.
	useEffect(() => {
		setReviewPassed(false)
		return () => setReviewPassed(false)
	}, [])

	// 내용이 바뀌면 이전 검수는 무효.
	useEffect(() => {
		if (modified) setReviewPassed(false)
	}, [modified])

	function runReview() {
		// ponytail: 실제 검수는 review feature가 담당(미완성). 완성되면 여기서 검수를 호출하고 결과로 통과 여부를 정한다.
		setReviewPassed(true)
		toast.success('검수 통과 — 이제 변경사항을 게시할 수 있습니다.')
	}

	return (
		<Button
			buttonStyle={passed && !modified ? 'secondary' : 'primary'}
			onClick={runReview}
			disabled={passed && !modified}
		>
			{passed && !modified ? '검수 통과됨' : '검수'}
		</Button>
	)
}
