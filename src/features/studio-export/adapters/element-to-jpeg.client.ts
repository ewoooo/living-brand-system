'use client'

import { toJpeg } from 'html-to-image'

/** DOM element 하나를 RGB JPEG Blob으로 변환한다. 다운로드는 공통 useExport가 소유한다. */
export async function elementToJpeg(
	element: HTMLElement,
	options: { width: number; height: number; quality: number },
): Promise<Blob> {
	const dataUrl = await toJpeg(element, {
		backgroundColor: '#fff',
		cacheBust: true,
		canvasHeight: options.height,
		canvasWidth: options.width,
		pixelRatio: 1,
		quality: options.quality / 100,
	})
	const response = await fetch(dataUrl)
	if (!response.ok) throw new Error('JPEG 변환 결과를 읽지 못했습니다.')
	return response.blob()
}
