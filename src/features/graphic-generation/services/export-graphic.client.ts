'use client'

import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { renderGraphicStudioSvg } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import type { ExportResult } from '@/features/studio-export/export-contract'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'

/**
 * Graphic SVG export use case: Effective Config와 현재 값을 runtime adapter로 투영한다.
 * SVG 생성은 Graphic runtime이 소유하고 다운로드는 공통 useExport가 담당한다.
 */
export function exportGraphicStudioSvg(
	config: GraphicStudioConfig,
	values: ControllerValues,
	viewport: { width: number; height: number },
): ExportResult {
	const svg = renderGraphicStudioSvg(config, values, viewport)
	if (!svg) throw new Error('SVG export is unavailable.')
	return {
		data: new Blob([svg], { type: 'image/svg+xml' }),
		filename: `${config.id}.svg`,
		mimeType: 'image/svg+xml',
	}
}
