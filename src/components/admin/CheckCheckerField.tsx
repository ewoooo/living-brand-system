'use client'

import { RelationshipField, useForm, useFormFields } from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'
import { useEffect } from 'react'
import { relationshipId } from '@/features/guideline/utils/block-text'
import { siblingPath } from './sibling-path'

type CheckExecutor = 'deterministic' | 'heuristic' | 'manual'

const isCheckExecutor = (value: unknown): value is CheckExecutor =>
	value === 'deterministic' || value === 'heuristic' || value === 'manual'

const CheckCheckerField: RelationshipFieldClientComponent = (props) => {
	const { path } = props
	const { dispatchFields } = useForm()
	const executorPath = siblingPath(path, 'executor')
	const checkerValue = useFormFields(([fields]) => fields[path]?.value)
	const executorValue = useFormFields(([fields]) => fields[executorPath]?.value)
	const populatedExecutor =
		checkerValue && typeof checkerValue === 'object' && 'executor' in checkerValue
			? checkerValue.executor
			: undefined
	const checkerId = relationshipId(checkerValue)

	useEffect(() => {
		if (isCheckExecutor(populatedExecutor)) {
			if (executorValue !== populatedExecutor) {
				dispatchFields({ type: 'UPDATE', path: executorPath, value: populatedExecutor })
			}
			return
		}
		if (checkerId === null) return

		const controller = new AbortController()
		void fetch(`/api/rule-checkers/${checkerId}?depth=0`, { signal: controller.signal })
			.then((response) => (response.ok ? response.json() : null))
			.then((checker: { executor?: unknown } | null) => {
				if (isCheckExecutor(checker?.executor) && executorValue !== checker.executor) {
					dispatchFields({ type: 'UPDATE', path: executorPath, value: checker.executor })
				}
			})
			.catch(() => undefined)
		return () => controller.abort()
	}, [checkerId, dispatchFields, executorPath, executorValue, populatedExecutor])

	return <RelationshipField {...props} />
}

export default CheckCheckerField
