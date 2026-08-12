import { toBlob } from 'html-to-image'
import type { CSSProperties } from 'react'
import {
	type ImageColorAdjustment,
	imageColorizeStyle,
} from '@/features/image-studio/image-colorize'
import { downloadBlob } from '@/lib/object-url'
import type { ImageStudioConfig } from './image-studio-config'

/**
 * 생성 이미지를 파일로 저장한다 — 색이 없으면 원본을 앵커 클릭으로 그대로 내려주고, 색이 있으면
 * 같은 색 계산(imageColorizeStyle)을 HTML로 직렬화해 export 어댑터가 PNG로 굽는다.
 * 서버·DB에는 아무것도 남기지 않는다(색은 출력 시점 옵션이고 정본은 GeneratedImages의 원본이다).
 */
export async function downloadImage(
	src: string,
	index: number,
	color: ImageColorAdjustment | null | undefined,
	output: ImageStudioConfig['output'],
): Promise<void> {
	const name = `hd-image-${index + 1}`
	if (!color && (output?.original ?? true)) {
		const ext = src.startsWith('data:image/')
			? src.slice(11, src.indexOf(';')).replace('jpeg', 'jpg')
			: new URL(src, window.location.href).pathname.split('.').pop() || 'png'
		const anchor = document.createElement('a')
		anchor.href = src
		anchor.download = `${name}.${ext}`
		document.body.appendChild(anchor)
		anchor.click()
		anchor.remove()
		return
	}
	if (!output?.formats.includes('png')) {
		throw new Error('PNG output is unavailable.')
	}

	// 스테이지를 이미지의 자연 크기로 잡는다 — 화면 썸네일 크기로 캡처하면 해상도를 잃는다.
	const { naturalHeight, naturalWidth } = await loadImage(src)
	const holder = document.createElement('div')
	holder.style.cssText = 'position:fixed;left:-99999px;top:0'
	const stage = createImageExportStage(src, color, naturalWidth, naturalHeight)
	holder.appendChild(stage)
	document.body.appendChild(holder)
	try {
		const blob = await toBlob(stage, {
			cacheBust: true,
			canvasHeight: naturalHeight,
			canvasWidth: naturalWidth,
			pixelRatio: 1,
		})
		if (!blob) throw new Error('PNG rendering failed.')
		downloadBlob(blob, `${name}.png`)
	} finally {
		holder.remove()
	}
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
