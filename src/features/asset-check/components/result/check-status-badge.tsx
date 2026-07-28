'use client'

import { motion } from 'motion/react'
import { Spinner } from '@/components/ui/spinner'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { CHECK_STATUS, checkDisplayStatus } from '@/features/asset-check/components/check-status'
import { cn } from '@/lib/utils'

/**
 * 상태 pill / 진행 스피너.
 * in : { outcome?: CheckResult; inProgress: boolean }
 * 매핑: checkDisplayStatus(outcome.rawResult)
 *       → 'pass'|'ok'|'advisory'|'needs_review'|'fail'|'not_applicable'
 *       → CHECK_STATUS[status] { label, pill, dot }  (check-status.ts 소유)
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
		return (
			<motion.span
				initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.96 }}
				animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
				exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.96 }}
				transition={{ duration: 0.16, ease: 'easeOut' }}
				className={cn(
					'inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-body text-xs font-semibold',
					CHECK_STATUS[checkDisplayStatus(outcome.rawResult)].pill,
				)}
			>
				{CHECK_STATUS[checkDisplayStatus(outcome.rawResult)].label}
			</motion.span>
		)
	}
	if (inProgress) {
		return (
			<motion.span
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
