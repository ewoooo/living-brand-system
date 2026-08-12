import {
	acceptsControllerExecutionValues,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/features/studio-controller/controller-definition'
import type { StudioOutputCapability } from '@/features/studio-export/studio-output'
import { supportsStudioOutput } from '@/features/studio-export/studio-output'
import type { PrintPpi } from '../print-policy'

export type TemplateExportFormat = 'png' | 'tiff' | 'pdf'

export type TemplateExportContext = {
	fileName: string
	height: number
	html: string
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	width: number
	output: StudioOutputCapability<TemplateExportFormat>
	controller: {
		groups: readonly ControllerGroupDefinition[]
		values: Readonly<ControllerValues>
	}
}

/**
 * 템플릿과 출력 정책으로 형식별 export 가능 여부를 판정한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export function canExportTemplate(
	format: TemplateExportFormat,
	context: TemplateExportContext,
): boolean {
	return (
		supportsStudioOutput(context.output, format) &&
		supportsTemplateExport(format, context) &&
		acceptsControllerExecutionValues(context.controller.groups, context.controller.values)
	)
}

/** Config 파생용 실제 adapter/source capability. Admin 정책은 여기서 섞지 않는다. */
export function supportsTemplateExport(
	format: TemplateExportFormat,
	context: Omit<TemplateExportContext, 'output' | 'controller'>,
): boolean {
	return format === 'png' || Boolean(context.printPpi && context.templateVersion)
}
