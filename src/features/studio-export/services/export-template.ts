import type { StudioOutputCapability } from '@/features/studio-export/studio-output'
import { supportsStudioExportRequest } from '@/features/studio-export/studio-output'
import {
	acceptsControllerExecutionValues,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import type { ExportArtifactProducer, RasterArtifact } from '../export-artifact'
import type { CmykColorProfile, ExportRequest, StudioOutputFormat } from '../export-contract'
import type { PrintPpi } from '../print-policy'

export type TemplateExportRequest =
	| Extract<ExportRequest, { format: 'png' }>
	| (Extract<ExportRequest, { format: 'tiff' | 'pdf' }> & {
			colorProfile: CmykColorProfile
	  })

export type TemplateRasterArtifactSource = {
	height: number
	html: string
	width: number
}

export type TemplateRasterArtifact = RasterArtifact<TemplateRasterArtifactSource>
export type TemplateRasterArtifactProducer = ExportArtifactProducer<TemplateRasterArtifact>

export type TemplateExportMetadata = {
	fileName: string
	printPpi?: PrintPpi
	templateId: number
	templateVersion?: string
	controller: {
		groups: readonly ControllerGroupDefinition[]
		values: Readonly<ControllerValues>
	}
}

export type TemplateExportContext = {
	capability: StudioOutputCapability
	metadata: TemplateExportMetadata | null
}

/** Template 렌더 결과를 파일 형식과 무관한 Raster Artifact로 만든다. */
export function createTemplateRasterArtifact(
	source: TemplateRasterArtifactSource,
): TemplateRasterArtifact {
	return { kind: 'raster', source }
}

/**
 * 템플릿과 출력 정책으로 형식별 export 가능 여부를 판정한다.
 * 실제 DOM·HTTP·다운로드 I/O는 형식별 client adapter가 소유한다.
 */
export function canExportTemplate(
	request: TemplateExportRequest,
	context: TemplateExportContext,
): boolean {
	const { metadata } = context
	return (
		metadata !== null &&
		supportsStudioExportRequest(context.capability, request) &&
		supportsTemplateExport(request.format, metadata) &&
		acceptsControllerExecutionValues(metadata.controller.groups, metadata.controller.values)
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
	metadata: Pick<TemplateExportMetadata, 'printPpi' | 'templateVersion'>,
): boolean {
	return (
		format === 'png' ||
		((format === 'tiff' || format === 'pdf') &&
			Boolean(metadata.printPpi && metadata.templateVersion))
	)
}
