'use client'

import { Controller } from '@/components/shared/controller'
import { CHECK_STATUS, CHECK_VERDICT_ICON } from '@/components/studio/review/result/check-status'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { CheckImage } from '@/features/asset-check/types'
import { checkImageVerdict } from '@/features/asset-check/utils/check-image-verdict'

/**
 * 파일 한 장의 종합 판정 표시 — 목록 행과 요약 제목이 같은 것을 보여준다(디자인 56:2087).
 *
 * 판정 4종만 상태 타일이다. 진행 중(`running`)과 검사 자체의 실패(`failed`)는 판정 어휘가 아니라
 * 🔴 타일로 그리면 "검사가 끝났다"는 거짓 신호가 되므로 각자의 표시를 쓴다.
 */
export function CheckVerdictStatus({ image }: { image: CheckImage }) {
	const verdict = checkImageVerdict(image)

	if (verdict === 'idle') return null
	if (verdict === 'running') {
		return <Spinner className="size-4 text-muted-foreground" aria-label="검수 중" />
	}
	if (verdict === 'failed') {
		return (
			<Badge variant="muted" shape="rounded">
				검사 실패
			</Badge>
		)
	}

	const status = CHECK_STATUS[verdict]
	const Icon = CHECK_VERDICT_ICON[verdict]

	return (
		<Controller.Status tone={status.variant} label={status.label}>
			<Icon aria-hidden />
		</Controller.Status>
	)
}
