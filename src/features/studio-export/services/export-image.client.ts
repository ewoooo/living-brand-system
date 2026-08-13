import type { CSSProperties } from 'react'
import {
	type ImageColorAdjustment,
	imageColorizeStyle,
} from '@/features/image-generation/runtime/image-colorize'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import { exportResultsToZip } from '../adapters/export-results-to-zip.client'
import type { RasterArtifact } from '../export-artifact'
import type { ExportRequest, ExportResult } from '../export-contract'
import type { StudioExportSource } from './execute-studio-export'

export type ImageExportRequest = Extract<ExportRequest, { format: 'original' | 'png' | 'jpeg' }> & {
	scope: 'selected' | 'all'
	package?: 'zip'
}

export type ImageRasterArtifactSource = {
	images: readonly string[]
	color: ImageColorAdjustment | null | undefined
}

export type ImageRasterArtifact = RasterArtifact<ImageRasterArtifactSource>

/** 생성 결과를 파일 형식과 무관한 Raster Artifact로 만든다. */
export function createImageRasterArtifact(source: ImageRasterArtifactSource): ImageRasterArtifact {
	return { kind: 'raster', source }
}

/** Raster Artifact와 선택 상태를 기존 공통 export 실행 port에 결합하는 이행 bridge다. */
export function createImageExportSource(
	artifact: ImageRasterArtifact | null,
	selected: number | null,
): StudioExportSource<ImageExportRequest> {
	if (!artifact) return {}
	const context = { ...artifact.source, selected }
	return {
		original: (request) =>
			exportImageScope(context, request, (src, index) => exportImageOriginal(src, index)),
		raster: {
			png: (request) =>
				exportImageScope(context, request, (src, index) =>
					exportImagePng(src, index, context.color, request),
				),
			jpeg: (request) =>
				exportImageScope(context, request, (src, index) =>
					exportImageJpeg(src, index, context.color, request),
				),
		},
	}
}

/**
 * 생성 이미지 원본 하나를 ExportResult로 만든다. fetch I/O는 브라우저가 소유한다.
 */
export async function exportImageOriginal(src: string, index: number): Promise<ExportResult> {
	const name = `hd-image-${index + 1}`
	const response = await fetch(src)
	if (!response.ok) throw new Error('원본 이미지를 불러오지 못했습니다.')
	const data = await response.blob()
	const extension = imageExtension(data.type, src)
	return {
		data,
		filename: `${name}.${extension}`,
		mimeType: data.type || `image/${extension}`,
	}
}

/** 생성 이미지 하나를 PNG로 캡처한다. DOM I/O는 element adapter가 소유한다. */
export function exportImagePng(
	src: string,
	index: number,
	color: ImageColorAdjustment | null | undefined,
	request: Extract<ImageExportRequest, { format: 'png' }>,
): Promise<ExportResult> {
	return withImageExportStage(src, color, async (stage, naturalWidth, naturalHeight) => {
		const data = await elementToPng(stage, {
			height: naturalHeight,
			scale: request.options.scale,
			transparent: request.options.transparent,
			width: naturalWidth,
		})
		return { data, filename: `hd-image-${index + 1}.png`, mimeType: 'image/png' }
	})
}

/** 생성 이미지 하나를 JPEG로 캡처한다. DOM I/O는 element adapter가 소유한다. */
export function exportImageJpeg(
	src: string,
	index: number,
	color: ImageColorAdjustment | null | undefined,
	request: Extract<ImageExportRequest, { format: 'jpeg' }>,
): Promise<ExportResult> {
	return withImageExportStage(src, color, async (stage, naturalWidth, naturalHeight) => {
		const data = await elementToJpeg(stage, {
			height: naturalHeight,
			quality: request.options.quality,
			width: naturalWidth,
		})
		return { data, filename: `hd-image-${index + 1}.jpg`, mimeType: 'image/jpeg' }
	})
}

async function exportImageScope(
	context: ImageRasterArtifactSource & { selected: number | null },
	request: ImageExportRequest,
	exportOne: (src: string, index: number) => Promise<ExportResult>,
): Promise<ExportResult | readonly ExportResult[]> {
	const { images } = context
	if (request.scope === 'selected') {
		const { selected } = context
		if (selected === null || !images[selected]) {
			throw new Error('저장할 이미지를 선택해 주세요.')
		}
		return exportOne(images[selected], selected)
	}
	const items = await Promise.all(images.map(exportOne))
	return request.package
		? exportResultsToZip({ format: request.package, filename: 'hd-images.zip', items })
		: items
}

async function withImageExportStage(
	src: string,
	color: ImageColorAdjustment | null | undefined,
	render: (
		stage: HTMLElement,
		naturalWidth: number,
		naturalHeight: number,
	) => Promise<ExportResult>,
): Promise<ExportResult> {
	// 스테이지를 이미지의 자연 크기로 잡는다 — 화면 썸네일 크기로 캡처하면 해상도를 잃는다.
	const { naturalHeight, naturalWidth } = await loadImage(src)
	const holder = document.createElement('div')
	holder.style.cssText = 'position:fixed;left:-99999px;top:0'
	const stage = createImageExportStage(src, color, naturalWidth, naturalHeight)
	holder.appendChild(stage)
	document.body.appendChild(holder)
	try {
		return await render(stage, naturalWidth, naturalHeight)
	} finally {
		holder.remove()
	}
}

function imageExtension(mimeType: string, src: string): string {
	if (mimeType.startsWith('image/')) {
		return mimeType.slice('image/'.length).replace('jpeg', 'jpg').replace('svg+xml', 'svg')
	}
	return new URL(src, window.location.href).pathname.split('.').pop() || 'png'
}

/** 프리뷰와 같은 색 계산을 안전하게 만든 DOM stage에 그대로 적용한다. */
function createImageExportStage(
	src: string,
	color: ImageColorAdjustment | null | undefined,
	width: number,
	height: number,
): HTMLElement {
	if (!color) {
		const image = document.createElement('img')
		image.id = '__stage'
		image.src = src
		image.width = width
		image.height = height
		return image
	}
	const { base, overlay } = imageColorizeStyle(src, color)
	const stage = document.createElement('div')
	stage.id = '__stage'
	Object.assign(stage.style, base, {
		position: 'relative',
		width: `${width}px`,
		height: `${height}px`,
	} satisfies CSSProperties)
	const layer = document.createElement('div')
	Object.assign(layer.style, overlay, {
		position: 'absolute',
		inset: '0',
	} satisfies CSSProperties)
	stage.appendChild(layer)
	return stage
}

/** 자연 크기를 알려면 이미지가 먼저 로드돼야 한다 — 브라우저 리소스 I/O는 이 함수만 한다. */
function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.addEventListener('load', () => resolve(image), { once: true })
		image.addEventListener(
			'error',
			() => reject(new Error('저장할 이미지를 불러오지 못했습니다.')),
			{ once: true },
		)
		image.src = src
	})
}
