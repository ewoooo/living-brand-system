'use client'

import { canvasFramesToMp4 } from '../adapters/canvas-frames-to-mp4.mediabunny.client'
import { vectorSceneToSvg } from '../adapters/vector-scene-to-svg'
import type {
	CanvasRasterSource,
	CanvasVideoSource,
	RasterArtifact,
	VectorSceneArtifact,
	VideoArtifact,
} from '../export-artifact'
import type { ExportRequest, ExportResult } from '../export-contract'
import type { StudioExportSource } from './execute-studio-export'

export type GraphicExportRequest = Extract<ExportRequest, { format: 'svg' | 'mp4' }>

export type GraphicBrowserArtifacts = {
	raster: RasterArtifact<CanvasRasterSource>
	video?: VideoArtifact<CanvasVideoSource>
}

/** Graphic Artifact를 기존 format-dispatch 실행 port에 연결하는 이행 bridge다. */
export function createGraphicExportSource({
	artifacts,
	createVectorArtifact,
	id,
}: {
	artifacts: GraphicBrowserArtifacts | null
	createVectorArtifact: (width: number, height: number) => VectorSceneArtifact | null
	id: string
}): StudioExportSource<GraphicExportRequest> {
	const video = artifacts?.video
	return {
		vector: {
			svg: (request) => {
				const artifact = createVectorArtifact(request.options.width, request.options.height)
				if (!artifact) throw new Error('SVG export is unavailable.')
				return exportVectorArtifactAsSvg(id, artifact)
			},
		},
		video: video
			? { mp4: (request) => exportVideoArtifactAsMp4(id, video, request) }
			: undefined,
	}
}

/** Vector Artifact를 SVG 결과로 직렬화한다. */
export function exportVectorArtifactAsSvg(id: string, artifact: VectorSceneArtifact): ExportResult {
	return {
		data: new Blob([vectorSceneToSvg(artifact)], { type: 'image/svg+xml' }),
		filename: `${id}.svg`,
		mimeType: 'image/svg+xml',
	}
}

/** Video Artifact의 결정론적 frame source를 MP4 결과로 인코딩한다. */
export async function exportVideoArtifactAsMp4(
	id: string,
	artifact: VideoArtifact<CanvasVideoSource>,
	request: Extract<GraphicExportRequest, { format: 'mp4' }>,
): Promise<ExportResult> {
	const { canvas, renderFrame, restore } = artifact.source
	try {
		const data = await canvasFramesToMp4({
			canvas,
			renderFrame: (timeSeconds) =>
				renderFrame(timeSeconds, request.options.width, request.options.height),
			spec: request.options,
		})
		return { data, filename: `${id}.mp4`, mimeType: 'video/mp4' }
	} finally {
		restore()
	}
}
