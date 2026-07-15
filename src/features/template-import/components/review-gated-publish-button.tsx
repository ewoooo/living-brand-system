'use client'

import { Button, PublishButton, useFormModified } from '@payloadcms/ui'
import type { PublishButtonClientProps } from 'payload'
import { useReviewPassed } from '../hooks/use-review-gate'

/**
 * [변경사항 게시] 버튼 오버라이드. (검수 통과 && 수정사항 없음)일 때만 내장 PublishButton을 노출하고,
 * 그 외에는 비활성 버튼을 보여 게시를 막는다. 초안 저장(SaveDraftButton)은 건드리지 않아 언제든 가능하다.
 * 내장 버튼을 감싸기만 하므로 게시 권한·버전 로직은 Payload가 그대로 처리한다.
 */
export default function ReviewGatedPublishButton(props: PublishButtonClientProps) {
	const modified = useFormModified()
	const passed = useReviewPassed()

	if (passed && !modified) return <PublishButton {...props} />

	return (
		<Button buttonStyle="primary" disabled>
			변경사항 게시 (검수 필요)
		</Button>
	)
}
