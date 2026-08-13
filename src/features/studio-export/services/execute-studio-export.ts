import type { ExportRequest, ExportResult } from '../export-contract'

type ExportExecutionResult =
	| ExportResult
	| readonly ExportResult[]
	| Promise<ExportResult | readonly ExportResult[]>

type ExportHandler<Request extends ExportRequest, Format extends ExportRequest['format']> = (
	request: Extract<Request, { format: Format }>,
) => ExportExecutionResult

/**
 * Studio가 보유한 출력 형식 family별 실행 port다.
 * 각 handler는 이미 좁혀진 단일 형식만 처리하고, 형식 선택은 executeStudioExport가 소유한다.
 */
export type StudioExportSource<Request extends ExportRequest = ExportRequest> = {
	original?: ExportHandler<Request, 'original'>
	raster?: {
		png?: ExportHandler<Request, 'png'>
		jpeg?: ExportHandler<Request, 'jpeg'>
	}
	print?: {
		tiff?: ExportHandler<Request, 'tiff'>
		pdf?: ExportHandler<Request, 'pdf'>
	}
	vector?: { svg?: ExportHandler<Request, 'svg'> }
	video?: { mp4?: ExportHandler<Request, 'mp4'> }
}

/** 요청 형식에 대응하는 실행 port가 현재 Studio source에 있는지 판정한다. 외부 I/O는 수행하지 않는다. */
export function supportsStudioExportSource<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): boolean {
	return Boolean(getHandler(source, request))
}

/** Studio export 요청을 해당 format family 실행 port로 전달한다. 외부 I/O는 source handler가 소유한다. */
export function executeStudioExport<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): ExportExecutionResult {
	const handler = getHandler(source, request)
	if (!handler) throw new Error(`${request.format.toUpperCase()} export is unavailable.`)
	return handler(request)
}

function getHandler<Request extends ExportRequest>(
	source: StudioExportSource<Request>,
	request: Request,
): ((request: Request) => ExportExecutionResult) | undefined {
	switch (request.format) {
		case 'original':
			return source.original as ((request: Request) => ExportExecutionResult) | undefined
		case 'png':
			return source.raster?.png as ((request: Request) => ExportExecutionResult) | undefined
		case 'jpeg':
			return source.raster?.jpeg as ((request: Request) => ExportExecutionResult) | undefined
		case 'tiff':
			return source.print?.tiff as ((request: Request) => ExportExecutionResult) | undefined
		case 'pdf':
			return source.print?.pdf as ((request: Request) => ExportExecutionResult) | undefined
		case 'svg':
			return source.vector?.svg as ((request: Request) => ExportExecutionResult) | undefined
		case 'mp4':
			return source.video?.mp4 as ((request: Request) => ExportExecutionResult) | undefined
	}
}
