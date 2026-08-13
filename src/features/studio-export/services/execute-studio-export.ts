import type { ExportRequest, ExportResult, StudioOutputFormat } from '../export-contract'

type ExportExecutionResult =
	| ExportResult
	| readonly ExportResult[]
	| Promise<ExportResult | readonly ExportResult[]>

type ArtifactHandler<Request extends ExportRequest, Kind extends ExportRequest['artifact']> = (
	request: Extract<Request, { artifact: Kind }>,
) => ExportExecutionResult

type FormatHandler<
	Request extends ExportRequest,
	Kind extends ExportRequest['artifact'],
	Format extends StudioOutputFormat,
> = (request: Extract<Request, { artifact: Kind; format: Format }>) => ExportExecutionResult

/**
 * Studio가 보유한 Artifact 종류별 실행 port다.
 * Raster·Vector·Video 안의 파일 형식 선택은 executeStudioExport가 소유한다.
 */
export type StudioExportSource<Request extends ExportRequest = ExportRequest> = {
	original?: ArtifactHandler<Request, 'original'>
	raster?: {
		png?: FormatHandler<Request, 'raster', 'png'>
		jpeg?: FormatHandler<Request, 'raster', 'jpeg'>
		tiff?: FormatHandler<Request, 'raster', 'tiff'>
		pdf?: FormatHandler<Request, 'raster', 'pdf'>
	}
	vector?: { svg?: FormatHandler<Request, 'vector', 'svg'> }
	video?: { mp4?: FormatHandler<Request, 'video', 'mp4'> }
}

/** 요청 Artifact와 형식에 대응하는 실행 port가 있는지 판정한다. 외부 I/O는 수행하지 않는다. */
export function supportsStudioExportSource<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): boolean {
	return Boolean(getHandler(source, request))
}

/** Studio export 요청을 해당 Artifact 실행 port로 전달한다. 외부 I/O는 source handler가 소유한다. */
export function executeStudioExport<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): ExportExecutionResult {
	const handler = getHandler(source, request)
	if (!handler) throw new Error(`${requestLabel(request)} export is unavailable.`)
	return handler(request)
}

function getHandler<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): ((request: Request) => ExportExecutionResult) | undefined {
	switch (request.artifact) {
		case 'original':
			return source.original as ((request: Request) => ExportExecutionResult) | undefined
		case 'raster':
			switch (request.format) {
				case 'png':
					return source.raster?.png as
						| ((request: Request) => ExportExecutionResult)
						| undefined
				case 'jpeg':
					return source.raster?.jpeg as
						| ((request: Request) => ExportExecutionResult)
						| undefined
				case 'tiff':
					return source.raster?.tiff as
						| ((request: Request) => ExportExecutionResult)
						| undefined
				case 'pdf':
					return source.raster?.pdf as
						| ((request: Request) => ExportExecutionResult)
						| undefined
			}
			return undefined
		case 'vector':
			return source.vector?.svg as ((request: Request) => ExportExecutionResult) | undefined
		case 'video':
			return source.video?.mp4 as ((request: Request) => ExportExecutionResult) | undefined
	}
}

function requestLabel(request: ExportRequest): string {
	return request.artifact === 'original' ? 'ORIGINAL' : request.format.toUpperCase()
}
