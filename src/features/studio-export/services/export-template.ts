import type { StudioOutputCapability } from '@/features/studio-export/studio-output'
import { supportsStudioExportRequest } from '@/features/studio-export/studio-output'
import {
	acceptsControllerExecutionValues,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import type { CmykColorProfile, ExportRequest, StudioOutputFormat } from '../export-contract'
import type { PrintPpi } from '../print-policy'

export type TemplateExportRequest =
	| Extract<ExportRequest, { format: 'png' }>
	| (Extract<ExportRequest, { format: 'tiff' | 'pdf' }> & {
			colorProfile: CmykColorProfile
	  })
export type TemplateExportContext = {
	fileName: string
	height: number
	html: string
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	width: number
	output: StudioOutputCapability
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
	request: TemplateExportRequest,
	context: TemplateExportContext,
): boolean {
	return (
		supportsStudioExportRequest(context.output, request) &&
		supportsTemplateExport(request.format, context) &&
		acceptsControllerExecutionValues(context.controller.groups, context.controller.values)
	)
}

/** UI의 형식 선택을 완전한 공통 요청으로 정규화한다. */
export function createTemplateExportRequest(
	format: StudioOutputFormat,
	printPpi?: PrintPpi,
): TemplateExportRequest | null {
	switch (format) {
		case 'png':
			return {
				format,
				colorProfile: { space: 'rgb', icc: 'srgb' },
				options: { scale: 1, transparent: true },
			}
		case 'tiff':
			return printPpi
				? {
						format,
						colorProfile: { space: 'cmyk', icc: DEFAULT_CMYK_ICC_PROFILE },
						options: { ppi: printPpi, compression: 'lzw' },
					}
				: null
		case 'pdf':
			return printPpi
				? {
						format,
						colorProfile: { space: 'cmyk', icc: DEFAULT_CMYK_ICC_PROFILE },
						options: { ppi: printPpi, bleedMm: 0 },
					}
				: null
		default:
			return null
	}
}

/** Config 파생용 실제 adapter/source capability. Admin 정책은 여기서 섞지 않는다. */
export function supportsTemplateExport(
	format: StudioOutputFormat,
	context: Omit<TemplateExportContext, 'output' | 'controller'>,
): boolean {
	return (
		format === 'png' ||
		((format === 'tiff' || format === 'pdf') &&
			Boolean(context.printPpi && context.templateVersion))
	)
}
