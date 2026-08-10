'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { checkDisplayStatus } from '@/features/asset-check/utils/check-display-status'
import { CHECK_STATUS } from './check-status'

/**
 * 상태 pill / 진행 스피너.
 * in : { outcome?: CheckResult; inProgress: boolean }
 * 매핑: checkDisplayStatus(outcome.rawResult)
 *       → 'pass'|'ok'|'advisory'|'needs_review'|'fail'|'not_applicable'
 *       → CHECK_STATUS[status] { label, variant }  (check-status.ts 소유)
 * outcome 없음 && inProgress → 스피너, 둘 다 없으면 null
 */
export function CheckStatusBadge({
	outcome,
	inProgress,
	shouldReduceMotion,
}: {
	outcome?: CheckResult
	inProgress: boolean
	shouldReduceMotion: boolean | null
}) {
	if (outcome) {
		const status = CHECK_STATUS[checkDisplayStatus(outcome.rawResult)]

		return (
			<Badge asChild variant={status.variant} shape="rounded">
				<motion.span
					initial={
						shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.96 }
					}
					animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
					exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.96 }}
					transition={{ duration: 0.16, ease: 'easeOut' }}
				>
					{status.label}
				</motion.span>
			</Badge>
		)
	}
	if (inProgress) {
		return (
			<motion.span
				data-slot="check-status-badge"
				initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
				animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
				exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
				transition={{ duration: 0.14, ease: 'easeOut' }}
				className="inline-flex justify-center"
				title="살펴보고 있습니다"
			>
				<Spinner className="size-3.5 text-muted-foreground" />
			</motion.span>
		)
	}
	return null
}
