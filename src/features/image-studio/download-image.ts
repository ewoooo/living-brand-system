import type { CSSProperties } from 'react'
import {
	type ImageColorAdjustment,
	imageColorizeStyle,
} from '@/features/image-studio/image-colorize'
import { exportHtmlToPng } from '@/features/template-export/services/export-template-png.client'

/**
 * 생성 이미지를 파일로 저장한다 — 색이 없으면 원본을 앵커 클릭으로 그대로 내려주고, 색이 있으면
 * 같은 색 계산(imageColorizeStyle)을 HTML로 직렬화해 export 어댑터가 PNG로 굽는다.
 * 서버·DB에는 아무것도 남기지 않는다(색은 출력 시점 옵션이고 정본은 GeneratedImages의 원본이다).
 */
export async function downloadImage(
	src: string,
	index: number,
	color?: ImageColorAdjustment | null,
): Promise<void> {
	const name = `essenherb-image-${index + 1}`
	if (!color) {
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

	// 스테이지를 이미지의 자연 크기로 잡는다 — 화면 썸네일 크기로 캡처하면 해상도를 잃는다.
	const { naturalHeight, naturalWidth } = await loadImage(src)
	await exportHtmlToPng(colorizedImageHtml(src, color, naturalWidth, naturalHeight), name)
}

/** 프리뷰와 같은 색 계산을 export stage가 읽는 인라인 style HTML로 옮긴다. */
function colorizedImageHtml(
	src: string,
	color: ImageColorAdjustment,
	width: number,
	height: number,
): string {
	const { base, overlay } = imageColorizeStyle(src, color)
	const stage = `position:relative;width:${width}px;height:${height}px;${inlineStyle(base)}`
	const layer = `position:absolute;left:0;top:0;width:100%;height:100%;${inlineStyle(overlay)}`
	return `<div id="__stage" style="${stage}"><div style="${layer}"></div></div>`
}

function inlineStyle(style: CSSProperties): string {
	return Object.entries(style)
		.map(([property, value]) => `${kebabCase(property)}:${value};`)
		.join('')
}

function kebabCase(property: string): string {
	return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
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
