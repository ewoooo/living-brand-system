'use client'

import { useFormFields } from '@payloadcms/ui'
import { Badge } from '@/components/ui/badge'
import { fieldRowCount } from './form-fields'
import { guidelineBreadcrumbCount, guidelineDocumentTypeLabel } from './guideline-document-tree'

export default function GuidelineDocumentLocation() {
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
			className="guideline-document-location"
		>
			<div className="guideline-document-location__header">
				<h3 id="guideline-document-location-title">문서 위치</h3>
				<Badge aria-live="polite" variant="secondary">
					현재 유형: {typeLabel}
				</Badge>
			</div>
			<p>상위 문서를 먼저 정하면 문서의 계층과 URL 경로가 함께 결정됩니다.</p>
		</section>
	)
}
