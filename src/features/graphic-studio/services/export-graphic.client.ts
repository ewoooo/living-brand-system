'use client'

import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import { renderGraphicStudioSvg } from '@/features/graphic-studio/graphic-studio-runtime'
import type { ControllerValues } from '@/features/studio-controller/controller-definition'
import { downloadBlob } from '@/lib/object-url'

/**
 * Graphic SVG export use case: Effective Config와 현재 값을 runtime adapter로 투영한다.
 * SVG 생성은 Graphic runtime이, 브라우저 파일 저장 I/O는 object-url helper가 소유한다.
 */
export function exportGraphicStudioSvg(
	config: GraphicStudioConfig,
	values: ControllerValues,
	viewport: { width: number; height: number },
): void {
	const svg = renderGraphicStudioSvg(config, values, viewport)
	if (!svg) throw new Error('SVG export is unavailable.')
	downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${config.id}.svg`)
}
