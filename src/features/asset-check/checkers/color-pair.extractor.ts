import { dominantColors, opaquePixels } from './color-metrics'
import type { ColorPairObservation, ExtractionResult, PixelGrid } from './types'

/** Raster에서 가장 많이 쓰인 두 색을 Contrast Checker 입력으로 추출한다. */
export function extractDominantColorPair(grid: PixelGrid): ExtractionResult<ColorPairObservation> {
	const colors = dominantColors(opaquePixels(grid), 2, 0.02)
	if (colors.length < 2) return { state: 'not_extractable', reasonCode: 'color_pair_not_found' }

	// ponytail: 지배색 1·2위를 배경/전경으로 본다. 영역·노드 정보가 생기면 의미 기반 추출로 교체한다.
	return {
		state: 'extracted',
		value: {
			kind: 'color-pair',
			background: colors[0].rgb,
			foreground: colors[1].rgb,
		},
	}
}
