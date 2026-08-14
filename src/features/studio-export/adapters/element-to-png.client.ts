'use client'

import { toBlob } from 'html-to-image'

/** DOM element 하나를 PNG Blob으로 변환한다. 다운로드는 공통 useExport가 소유한다. */
export async function elementToPng(
	element: HTMLElement,
	options: {
		width: number
		height: number
		scale: number
		transparent: boolean
	},
): Promise<Blob> {
	const blob = await toBlob(element, {
		...(options.transparent ? {} : { backgroundColor: '#fff' }),
		cacheBust: true,
		canvasHeight: options.height * options.scale,
		canvasWidth: options.width * options.scale,
		pixelRatio: options.scale,
	})
	if (!blob) throw new Error('PNG rendering failed.')
	return blob
}
