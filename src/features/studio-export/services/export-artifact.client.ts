'use client'

import { toCanvas } from 'html-to-image'
import type {
	BlobOriginalSource,
	CanvasVideoSource,
	OriginalArtifact,
	RasterArtifact,
	RasterRenderOptions,
	VectorSceneArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import { canvasFramesToMp4 } from '../adapters/canvas-frames-to-mp4.mediabunny.client'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import { vectorSceneToSvg } from '../adapters/vector-scene-to-svg'
import type { ExportRequest, ExportResult } from '../export-contract'
import type { PrintPpi } from '../print-policy'
import { requestPrintExport } from './export-print.client'

export type ExportableStudioArtifact =
	| RasterArtifact
	| VectorSceneArtifact
	| VideoArtifact<CanvasVideoSource>
	| OriginalArtifact<BlobOriginalSource>

/** Artifact 종류와 ExportRequest를 유일한 포맷 executor에 연결한다. */
export async function executeArtifactExport({
	artifact,
	fileName,
	renderSize,
	request,
}: {
	artifact: ExportableStudioArtifact
	fileName: string
	renderSize?: { width: number; height: number }
	request: ExportRequest
}): Promise<ExportResult> {
	if (artifact.kind !== request.artifact) throw new Error('Export Artifact가 요청과 다릅니다.')
	switch (request.artifact) {
		case 'original':
			return exportOriginalArtifact(artifact as OriginalArtifact<BlobOriginalSource>)
		case 'raster': {
			const raster = artifact as RasterArtifact
			switch (request.format) {
				case 'png':
					return exportRasterArtifactAsPng(fileName, raster, request, renderSize)
				case 'jpeg':
					return exportRasterArtifactAsJpeg(fileName, raster, request, renderSize)
				case 'tiff':
				case 'pdf':
					return exportRasterArtifactAsPrint(fileName, raster, request, renderSize)
				case 'mp4':
					return exportRasterArtifactAsMp4(fileName, raster, request)
			}
			throw new Error('지원하지 않는 Raster export 형식입니다.')
		}
		case 'vector':
			return request.format === 'pdf'
				? exportVectorArtifactAsPrintPdf(
						fileName,
						artifact as VectorSceneArtifact,
						request.options.ppi,
					)
				: exportVectorArtifactAsSvg(fileName, artifact as VectorSceneArtifact)
		case 'video':
			return exportVideoArtifactAsMp4(
				fileName,
				artifact as VideoArtifact<CanvasVideoSource>,
				request,
			)
	}
}

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

/**
 * Vector Artifact를 인쇄용 CMYK PDF로 만든다.
 * 🔴 변환은 서버가 한다 — ICC 색 변환(sharp)이 서버 전용이고 pdf-lib을 클라이언트 번들에 넣지 않는다.
 */
export async function exportVectorArtifactAsPrintPdf(
	fileName: string,
	artifact: VectorSceneArtifact,
	ppi: PrintPpi,
): Promise<ExportResult> {
	const response = await fetch('/api/studio-exports/vector-print', {
		body: JSON.stringify({ ppi, scene: artifact.source }),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	})
	if (!response.ok) throw new Error('인쇄용 PDF를 만들지 못했습니다.')
	return {
		data: await response.blob(),
		filename: `${fileName}.pdf`,
		mimeType: 'application/pdf',
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

/** 정적 Raster Artifact를 공통 Video encoder가 소비하는 frame으로 변환한다. */
export async function exportRasterArtifactAsMp4(
	fileName: string,
	artifact: RasterArtifact,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'mp4' }>,
): Promise<ExportResult> {
	const { width, height } = request.options
	const data = await artifact.source.withSurface({ width, height }, async (surface) => {
		const canvas =
			surface.kind === 'canvas'
				? surface.element
				: await toCanvas(surface.element, {
						canvasWidth: width,
						canvasHeight: height,
						pixelRatio: 1,
					})
		return canvasFramesToMp4({ canvas, renderFrame: () => {}, spec: request.options })
	})
	return { data, filename: `${fileName}.mp4`, mimeType: 'video/mp4' }
}

/** Raster Artifact를 출처와 무관하게 PNG 결과로 변환한다. */
export async function exportRasterArtifactAsPng(
	fileName: string,
	artifact: RasterArtifact,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'png' }>,
	renderSize?: { width: number; height: number },
): Promise<ExportResult> {
	const data = await renderRasterArtifactToPng(artifact, request.options, renderSize)
	return { data, filename: `${fileName}.png`, mimeType: 'image/png' }
}

/** Raster Artifact를 다른 인코더가 소비할 PNG로 렌더한다. */
export async function renderRasterArtifactToPng(
	artifact: RasterArtifact,
	options: { scale: number; transparent: boolean },
	renderSize?: { width: number; height: number },
): Promise<Blob> {
	const surfaceOptions: RasterRenderOptions = renderSize
		? {
				width: renderSize.width * options.scale,
				height: renderSize.height * options.scale,
			}
		: {}
	return await artifact.source.withSurface(surfaceOptions, (surface) =>
		surface.kind === 'canvas'
			? canvasToBlob(surface.element, 'image/png')
			: elementToPng(surface.element, {
					width: surface.width,
					height: surface.height,
					...options,
				}),
	)
}

/** Raster Artifact를 출처와 무관하게 JPEG 결과로 변환한다. */
export async function exportRasterArtifactAsJpeg(
	fileName: string,
	artifact: RasterArtifact,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'jpeg' }>,
	renderSize?: { width: number; height: number },
): Promise<ExportResult> {
	const data = await artifact.source.withSurface(renderSize ?? {}, (surface) =>
		surface.kind === 'canvas'
			? canvasToBlob(surface.element, 'image/jpeg', request.options.quality / 100)
			: elementToJpeg(surface.element, {
					width: surface.width,
					height: surface.height,
					quality: request.options.quality,
					scale: request.options.scale,
				}),
	)
	return { data, filename: `${fileName}.jpg`, mimeType: 'image/jpeg' }
}

/** Raster Artifact를 공통 서버 인쇄 adapter로 TIFF 또는 PDF로 변환한다. */
export async function exportRasterArtifactAsPrint(
	fileName: string,
	artifact: RasterArtifact,
	request: Extract<ExportRequest, { artifact: 'raster'; format: 'tiff' | 'pdf' }>,
	renderSize?: { width: number; height: number },
): Promise<ExportResult> {
	const data = await requestPrintExport({
		colorProfile: request.colorProfile.icc,
		fileName,
		format: request.format,
		// 🔴 여기 `scale: 1`이 하드코딩돼 있었다 — 어떤 해상도를 골라도 인쇄물이 캔버스 픽셀
		//    그대로 나가, A4 300ppi가 요구하는 픽셀을 만들 경로가 아예 없었다.
		png: await renderRasterArtifactToPng(
			artifact,
			{ scale: request.options.scale, transparent: false },
			renderSize,
		),
		ppi: request.options.ppi,
	})
	return {
		data,
		filename: `${fileName}.${request.format}`,
		mimeType: request.format === 'pdf' ? 'application/pdf' : 'image/tiff',
	}
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

function canvasToBlob(
	canvas: HTMLCanvasElement,
	mimeType: 'image/jpeg' | 'image/png',
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Canvas 변환에 실패했습니다.'))),
			mimeType,
			quality,
		),
	)
}
