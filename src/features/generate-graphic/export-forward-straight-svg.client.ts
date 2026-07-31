'use client'

import { revokeBlob } from '@/lib/object-url'
import type { ForwardStraightInput } from './forward-straight'
import { createForwardStraightScene } from './forward-straight-geometry'
import { createForwardStraightSvg } from './forward-straight-svg'

/**
 * Forward Straight 입력을 SVG로 만들어 브라우저에 내려받는 client use case.
 * 좌표 계산은 geometry가, Blob과 브라우저 다운로드 I/O는 이 adapter가 소유한다.
 */
export function exportForwardStraightSvg({
	fileName,
	input,
	viewport,
}: {
	fileName: string
	input: ForwardStraightInput
	viewport: { width: number; height: number }
}): void {
	const svg = createForwardStraightSvg(createForwardStraightScene(input, viewport))
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

	try {
		const link = document.createElement('a')
		link.href = url
		link.download = `${fileName}.svg`
		link.click()
	} finally {
		revokeBlob(url)
	}
}
