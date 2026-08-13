'use client'

import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicRuntime } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { canvasFramesToMp4 } from '@/features/studio-export/adapters/canvas-frames-to-mp4.mediabunny.client'
import type { ExportRequest, ExportResult } from '@/features/studio-export/export-contract'
import { supportsStudioExportRequest } from '@/features/studio-export/studio-output'

export type GraphicVideoExportRequest = Extract<ExportRequest, { format: 'mp4' }>
type GraphicVideoRuntime = NonNullable<GraphicRuntime['video']>

/** Graphic runtime의 결정론적 frame source를 MP4 ExportResult로 변환한다. 인코딩 I/O는 Mediabunny adapter가 소유한다. */
export async function exportGraphicStudioVideo(
	config: GraphicStudioConfig,
	request: GraphicVideoExportRequest,
	runtime: GraphicVideoRuntime,
): Promise<ExportResult> {
	if (!supportsStudioExportRequest(config.output, request)) {
		throw new Error('MP4 export is unavailable.')
	}
	try {
		const data = await canvasFramesToMp4({
			canvas: runtime.canvas,
			renderFrame: (timeSeconds) =>
				runtime.renderFrame(timeSeconds, request.options.width, request.options.height),
			spec: request.options,
		})
		return { data, filename: `${config.id}.mp4`, mimeType: 'video/mp4' }
	} finally {
		runtime.restore()
	}
}
