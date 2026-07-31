'use client'

import { useState } from 'react'
import {
	canExportTemplate,
	exportTemplate as executeTemplateExport,
	type TemplateExportContext,
	type TemplateExportFormat,
} from '../services/export-template.client'

/** PNG·TIFF·PDF export의 UI 진행·오류 상태만 조정한다. */
export function useTemplateExport(context: TemplateExportContext) {
	const [exporting, setExporting] = useState<TemplateExportFormat | null>(null)
	const [exportError, setExportError] = useState<string | null>(null)

	async function exportTemplate(format: TemplateExportFormat): Promise<void> {
		setExportError(null)
		setExporting(format)

		try {
			await executeTemplateExport(format, context)
		} catch (error) {
			setExportError(
				error instanceof Error
					? error.message
					: '파일을 내보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
			)
		} finally {
			setExporting(null)
		}
	}

	return {
		canExport: (format: TemplateExportFormat) => canExportTemplate(format, context),
		exporting,
		exportError,
		exportTemplate,
	}
}
