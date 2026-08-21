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
		// html-to-image가 canvas 크기를 canvasWidth × pixelRatio로 잡는다 — 양쪽에 배율을 주면
		// 제곱으로 커진다. 크기는 원본 좌표로 주고 배율은 pixelRatio 한 곳만 갖는다.
		canvasHeight: options.height,
		canvasWidth: options.width,
		pixelRatio: options.scale,
	})
	if (!blob) throw new Error('PNG rendering failed.')
	return blob
}
