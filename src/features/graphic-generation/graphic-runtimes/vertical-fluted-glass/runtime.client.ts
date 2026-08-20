'use client'

import { createLinearFlutedGlassRuntime } from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/runtime.client'
import type { GraphicRuntimeAdapter } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { toVerticalFlutedGlassInput } from './model'

/**
 * Vertical Fluted Glass의 브라우저 WebGL 미리보기.
 *
 * 셰이더·uniform 배선은 linear 런타임이 소유한다 — 세로형은 자기 기본값·프리셋으로
 * 검증한 입력을 같은 셰이더에 흘려 넣을 뿐이다.
 */
const verticalFlutedGlassRuntimeAdapter = {
	type: 'shader',
	async mount({ container, values }) {
		const runtime = await createLinearFlutedGlassRuntime({
			container,
			input: toVerticalFlutedGlassInput(values),
			ariaLabel: 'Vertical Fluted Glass 그래픽 미리보기',
		})
		return {
			update: (next) => runtime.update(toVerticalFlutedGlassInput(next)),
			resize: (width, height) => runtime.resize(width, height),
			getViewport: () => runtime.getViewport(),
			artifacts: runtime.artifacts,
			destroy: () => runtime.destroy(),
		}
	},
} satisfies GraphicRuntimeAdapter

export default verticalFlutedGlassRuntimeAdapter
