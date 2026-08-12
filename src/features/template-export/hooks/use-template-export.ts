'use client'

import { useExport } from '@/features/studio-export/utils/use-export'
import {
	canExportTemplate,
	type TemplateExportContext,
	type TemplateExportFormat,
} from '../services/export-template'
import { exportTemplate as executeTemplateExport } from '../services/export-template.client'

/** PNG·TIFF·PDF export의 UI 진행·오류 상태만 조정한다. */
export function useTemplateExport(context: TemplateExportContext) {
	const { canExport, error, exporting, run } = useExport<TemplateExportFormat>({
		canExport: (format) => canExportTemplate(format, context),
		execute: (format) => executeTemplateExport(format, context),
	})

	return {
		canExport,
		exporting,
		exportError: error,
		exportTemplate: run,
	}
}
