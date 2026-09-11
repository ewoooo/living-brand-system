'use client'

import p5 from 'p5'
import {
	createGraphicRasterArtifact,
	type GraphicRuntimeAdapter,
} from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import type { RasterArtifact } from '@/modules/studio-artifact/studio-artifact'
import {
	createKeyVisualFormationScene,
	type KeyVisualFormationInput,
	toKeyVisualFormationInput,
} from './model'

export type KeyVisualFormationRuntime = {
	update(input: KeyVisualFormationInput): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	artifacts: { raster: RasterArtifact }
	destroy(): void
}

/** Key Visual Formation의 브라우저 미리보기만 소유한다 — 좌표 계산은 model이 갖는다. */
export function createKeyVisualFormationRuntime({
	container,
	input,
}: {
	container: HTMLElement
	input: KeyVisualFormationInput
}): KeyVisualFormationRuntime {
	let currentInput = input
	let canvas: HTMLCanvasElement | null = null
	const initialSize = getCanvasSize(container.clientWidth, container.clientHeight)
	let viewport = initialSize
	const instance = new p5((preview) => {
		preview.setup = () => {
			canvas = preview.createCanvas(initialSize.width, initialSize.height)
				.elt as HTMLCanvasElement
			preview.pixelDensity(2)
			preview.noStroke()
			preview.noLoop()
		}

		preview.draw = () => {
			const scene = createKeyVisualFormationScene(currentInput, {
				width: preview.width,
				height: preview.height,
			})

			preview.background(scene.backgroundColor)
			for (const band of scene.bands) {
				preview.fill(band.fill)
				preview.rect(band.x, band.y, band.width, band.height)
			}
		}
	}, container)

	function render(width: number, height: number) {
		const size = getCanvasSize(width, height)
		instance.resizeCanvas(size.width, size.height)
		instance.redraw()
	}

	// 🔴 여기서 canvas를 요구하지 않는다 — p5가 `setup`을 `load`까지 미루면 아직 null이고,
	//    throw하면 Artifact가 등록되지 않아 내보내기·미리보기 갱신이 사라진다(간헐적).
	const raster = createGraphicRasterArtifact({
		canvas: () => canvas,
		getViewport: () => viewport,
		render,
	})

	return {
		update(nextInput) {
			currentInput = nextInput
			instance.redraw()
		},
		resize(width, height) {
			viewport = getCanvasSize(width, height)
			render(viewport.width, viewport.height)
		},
		getViewport() {
			return viewport
		},
		artifacts: { raster },
		destroy() {
			instance.remove()
		},
	}
}

function getCanvasSize(width: number, height: number) {
	return {
		width: Math.max(1, Math.floor(width)),
		height: Math.max(1, Math.floor(height)),
	}
}

const runtime = {
	type: 'p5',
	async mount({ container, values }) {
		const mounted = createKeyVisualFormationRuntime({
			container,
			input: toKeyVisualFormationInput(values),
		})
		return {
			update: (next) => mounted.update(toKeyVisualFormationInput(next)),
			resize: (width, height) => mounted.resize(width, height),
			getViewport: () => mounted.getViewport(),
			artifacts: mounted.artifacts,
			destroy: () => mounted.destroy(),
		}
	},
} satisfies GraphicRuntimeAdapter

export default runtime
