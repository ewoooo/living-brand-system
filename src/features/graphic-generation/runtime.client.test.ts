// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { isOriginHandleHit } from './graphic-runtimes/forward-straight/runtime.client'
import { createGraphicRasterArtifact } from './runtime/client/graphic-runtime.client'

describe('Forward Straight client runtime', () => {
	it('레드 닷 주변에서만 드래그를 시작한다', () => {
		const origin = { x: 100, y: 100 }

		expect(isOriginHandleHit({ x: 112, y: 100 }, origin, 2.5)).toBe(true)
		expect(isOriginHandleHit({ x: 113, y: 100 }, origin, 2.5)).toBe(false)
	})

	it('Raster Artifact export 뒤 현재 preview 해상도를 복원한다', () => {
		const canvas = document.createElement('canvas')
		const viewport = { width: 640, height: 480 }
		const render = vi.fn((width: number, height: number) => {
			canvas.width = width
			canvas.height = height
		})
		const artifact = createGraphicRasterArtifact({
			canvas,
			getViewport: () => viewport,
			render,
		})

		artifact.source.render(1920, 1080)
		artifact.source.restore()

		expect(render).toHaveBeenNthCalledWith(1, 1920, 1080)
		expect(render).toHaveBeenNthCalledWith(2, 640, 480)
		expect(canvas).toMatchObject({ width: 640, height: 480 })
	})
})
