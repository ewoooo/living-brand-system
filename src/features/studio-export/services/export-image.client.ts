import type { CSSProperties } from 'react'
import {
	type ImageColorAdjustment,
	imageColorizeStyle,
} from '@/features/image-generation/runtime/image-colorize'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import type { ExportRequest, ExportResult } from '../export-contract'

export type ImageExportRequest = Extract<ExportRequest, { format: 'original' | 'png' | 'jpeg' }> & {
	scope: 'selected' | 'all'
	package?: 'zip'
}

/**
 * 생성 이미지 하나를 ExportResult로 만든다. 원본 fetch와 DOM 캡처 I/O는 브라우저·element adapter가
 * 소유하고, 다운로드는 공통 useExport가 담당한다.
 */
export async function exportImage(
	src: string,
	index: number,
	color: ImageColorAdjustment | null | undefined,
	request: ImageExportRequest,
): Promise<ExportResult> {
	const name = `hd-image-${index + 1}`
	if (request.format === 'original') {
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

	// 스테이지를 이미지의 자연 크기로 잡는다 — 화면 썸네일 크기로 캡처하면 해상도를 잃는다.
	const { naturalHeight, naturalWidth } = await loadImage(src)
	const holder = document.createElement('div')
	holder.style.cssText = 'position:fixed;left:-99999px;top:0'
	const stage = createImageExportStage(src, color, naturalWidth, naturalHeight)
	holder.appendChild(stage)
	document.body.appendChild(holder)
	try {
		if (request.format === 'jpeg') {
			const data = await elementToJpeg(stage, {
				height: naturalHeight,
				quality: request.options.quality,
				width: naturalWidth,
			})
			return { data, filename: `${name}.jpg`, mimeType: 'image/jpeg' }
		}
		const data = await elementToPng(stage, {
			height: naturalHeight,
			scale: request.options.scale,
			transparent: request.options.transparent,
			width: naturalWidth,
		})
		return { data, filename: `${name}.png`, mimeType: 'image/png' }
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
