'use client'

import type {
	BlobOriginalSource,
	CanvasRasterSource,
	CanvasVideoSource,
	ElementRasterSource,
	HtmlRasterSource,
	OriginalArtifact,
	RasterArtifact,
	VectorSceneArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import { canvasFramesToMp4 } from '../adapters/canvas-frames-to-mp4.mediabunny.client'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import { htmlToPng } from '../adapters/html-to-png.client'
import { withSafeExportStage } from '../adapters/render-export-stage.client'
import { vectorSceneToSvg } from '../adapters/vector-scene-to-svg'
import type { ExportRequest, ExportResult } from '../export-contract'

/** Vector Artifact를 SVG 결과로 직렬화한다. */
export function exportVectorArtifactAsSvg(
	fileName: string,
	artifact: VectorSceneArtifact,
): ExportResult {
	return {
		data: new Blob([vectorSceneToSvg(artifact)], { type: 'image/svg+xml' }),
		filename: `${fileName}.svg`,
		mimeType: 'image/svg+xml',
	}
}

/** Video Artifact의 결정론적 frame source를 MP4 결과로 인코딩한다. */
export async function exportVideoArtifactAsMp4(
	fileName: string,
	artifact: VideoArtifact<CanvasVideoSource>,
	request: Extract<ExportRequest, { artifact: 'video'; format: 'mp4' }>,
): Promise<ExportResult> {
	const { canvas, renderFrame, restore } = artifact.source
	try {
		const data = await canvasFramesToMp4({
			canvas,
			renderFrame: (timeSeconds) =>
				renderFrame(timeSeconds, request.options.width, request.options.height),
			spec: request.options,
		})
		return { data, filename: `${fileName}.mp4`, mimeType: 'video/mp4' }
	} finally {
		restore()
	}
}

/** HTML Raster Artifact를 PNG 결과로 변환한다. */
export async function exportHtmlRasterArtifactAsPng(
	fileName: string,
	artifact: RasterArtifact<HtmlRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'png' }>,
): Promise<ExportResult> {
	const data = await renderHtmlRasterArtifactToPng(artifact, request.options)
	return { data, filename: `${fileName}.png`, mimeType: 'image/png' }
}

/** HTML Raster Artifact를 다른 인코더가 소비할 PNG로 렌더한다. */
export function renderHtmlRasterArtifactToPng(
	artifact: RasterArtifact<HtmlRasterSource>,
	options: { scale: number; transparent: boolean },
): Promise<Blob> {
	const { height, html, width } = artifact.source
	return htmlToPng(html, width, height, options)
}

/** HTML Raster Artifact를 JPEG 결과로 변환한다. */
export async function exportHtmlRasterArtifactAsJpeg(
	fileName: string,
	artifact: RasterArtifact<HtmlRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'jpeg' }>,
): Promise<ExportResult> {
	const { height, html, width } = artifact.source
	const data = await withSafeExportStage(html, (stage) =>
		elementToJpeg(stage, { width, height, quality: request.options.quality }),
	)
	return { data, filename: `${fileName}.jpg`, mimeType: 'image/jpeg' }
}

/** Canvas-backed Raster Artifact를 PNG 결과로 변환한다. */
export function exportCanvasRasterArtifactAsPng(
	fileName: string,
	artifact: RasterArtifact<CanvasRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'png' }>,
	size: { width: number; height: number },
): Promise<ExportResult> {
	return exportCanvasRasterArtifact(
		fileName,
		artifact,
		'image/png',
		'png',
		size.width * request.options.scale,
		size.height * request.options.scale,
	)
}

/** Canvas-backed Raster Artifact를 JPEG 결과로 변환한다. */
export function exportCanvasRasterArtifactAsJpeg(
	fileName: string,
	artifact: RasterArtifact<CanvasRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'jpeg' }>,
	size: { width: number; height: number },
): Promise<ExportResult> {
	return exportCanvasRasterArtifact(
		fileName,
		artifact,
		'image/jpeg',
		'jpg',
		size.width,
		size.height,
		request.options.quality / 100,
	)
}

/** DOM-backed Raster Artifact를 PNG 결과로 변환한다. */
export async function exportElementRasterArtifactAsPng(
	fileName: string,
	artifact: RasterArtifact<ElementRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'png' }>,
): Promise<ExportResult> {
	const data = await artifact.source.withElement((element, width, height) =>
		elementToPng(element, { width, height, ...request.options }),
	)
	return { data, filename: `${fileName}.png`, mimeType: 'image/png' }
}

/** DOM-backed Raster Artifact를 JPEG 결과로 변환한다. */
export async function exportElementRasterArtifactAsJpeg(
	fileName: string,
	artifact: RasterArtifact<ElementRasterSource>,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'jpeg' }>,
): Promise<ExportResult> {
	const data = await artifact.source.withElement((element, width, height) =>
		elementToJpeg(element, { width, height, quality: request.options.quality }),
	)
	return { data, filename: `${fileName}.jpg`, mimeType: 'image/jpeg' }
}

/** Original Artifact의 원본 Blob을 변환 없이 전달한다. */
export async function exportOriginalArtifact(
	artifact: OriginalArtifact<BlobOriginalSource>,
): Promise<ExportResult> {
	const data = await artifact.source.load()
	return {
		data,
		filename: artifact.source.filename(data),
		mimeType: artifact.source.mimeType(data),
	}
}

async function exportCanvasRasterArtifact(
	fileName: string,
	artifact: RasterArtifact<CanvasRasterSource>,
	mimeType: 'image/jpeg' | 'image/png',
	extension: 'jpg' | 'png',
	width: number,
	height: number,
	quality?: number,
): Promise<ExportResult> {
	const { canvas, render, restore } = artifact.source
	try {
		render(width, height)
		const data = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('Canvas 변환에 실패했습니다.'))),
				mimeType,
				quality,
			),
		)
		return { data, filename: `${fileName}.${extension}`, mimeType }
	} finally {
		restore()
	}
}
