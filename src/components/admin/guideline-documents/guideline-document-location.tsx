'use client'

import { useFormFields } from '@payloadcms/ui'
import { Badge } from '@/components/ui/badge'
import { fieldRowCount } from '../shared/form-fields'
import { guidelineBreadcrumbCount, guidelineDocumentTypeLabel } from './guideline-document-tree'

export function GuidelineDocumentLocation() {
	const typeLabel = useFormFields(([fields]) => {
		const breadcrumbs = fields.breadcrumbs
		return guidelineDocumentTypeLabel(
			guidelineBreadcrumbCount(
				breadcrumbs?.value,
				breadcrumbs?.initialValue,
				fieldRowCount(fields, 'breadcrumbs'),
			),
			Boolean(fields.parent?.value),
			Boolean(fields.parent?.isModified),
		)
	})

	return (
		<section
			aria-labelledby="guideline-document-location-title"
			className="mb-5 border-b border-border pb-2.5"
		>
			<div className="flex items-center justify-between">
				<h3 id="guideline-document-location-title" className="m-0">
					문서 위치
				</h3>
				<Badge aria-live="polite" variant="muted">
					현재 유형: {typeLabel}
				</Badge>
			</div>
			<p className="mt-1.25 mb-0 text-muted-foreground">
				상위 문서를 먼저 정하면 문서의 계층과 URL 경로가 함께 결정됩니다.
			</p>
		</section>
	)
}
