import type { StudioOutputCapability } from '@/features/studio-export/studio-output'
import {
	applyStudioOutputPolicy,
	projectPayloadStudioOutputPolicy,
	supportsStudioOutput,
} from '@/features/studio-export/studio-output'
import type { PrintPpi } from '../print-policy'

export const TEMPLATE_OUTPUT_FORMATS = ['png', 'tiff', 'pdf'] as const
export type TemplateExportFormat = (typeof TEMPLATE_OUTPUT_FORMATS)[number]

export type TemplateExportContext = {
	fileName: string
	height: number
	html: string
	output: StudioOutputCapability<TemplateExportFormat>
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	width: number
}

type TemplateOutputInputs = Pick<TemplateExportContext, 'printPpi' | 'templateVersion'>

/** Template 입력과 Admin 정책을 합쳐 브라우저에 공개할 Effective output capability를 만든다. */
export function resolveTemplateOutputCapability(
	inputs: TemplateOutputInputs,
	policyInput?: unknown,
): StudioOutputCapability<TemplateExportFormat> {
	const capability = {
		formats: TEMPLATE_OUTPUT_FORMATS.filter((format) =>
			hasTemplateOutputInputs(format, inputs),
		),
	}
	return applyStudioOutputPolicy(capability, projectPayloadStudioOutputPolicy(policyInput))
}

/** Effective capability와 Template 입력 조건을 함께 만족하는 형식만 실행에 허용한다. */
export function canExportTemplate(
	format: TemplateExportFormat,
	context: Pick<TemplateExportContext, 'output' | 'printPpi' | 'templateVersion'>,
): boolean {
	return supportsStudioOutput(context.output, format) && hasTemplateOutputInputs(format, context)
}

function hasTemplateOutputInputs(
	format: TemplateExportFormat,
	inputs: TemplateOutputInputs,
): boolean {
	return format === 'png' || Boolean(inputs.printPpi && inputs.templateVersion)
}
