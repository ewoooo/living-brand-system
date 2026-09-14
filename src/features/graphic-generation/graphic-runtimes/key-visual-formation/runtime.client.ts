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

/**
 * 면 이미지를 **data URI로** 읽는다.
 *
 * 🔴 원본 URL을 `<img>`에 그대로 물리면 캔버스가 오염돼(tainted) `toBlob`이 던지고 png·jpeg·pdf·mp4
 *    내보내기가 한꺼번에 죽는다. 바이트를 먼저 받아 data URI로 만들면 오염이 아예 생기지 않는다.
 */
async function loadPlaneImage(url: string): Promise<string | null> {
	try {
		const response = await fetch(url)
		if (!response.ok) return null
		const blob = await response.blob()
		return await new Promise<string | null>((resolve) => {
			const reader = new FileReader()
			reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
			reader.onerror = () => resolve(null)
			reader.readAsDataURL(blob)
		})
	} catch {
		// 이미지를 못 읽는 것은 그래픽의 실패가 아니다 — 면 색만으로 계속 그린다.
		return null
	}
}

/** Key Visual Formation의 브라우저 미리보기만 소유한다 — 좌표 계산은 model이 갖는다. */
export function createKeyVisualFormationRuntime({
	container,
	input,
	initialImage,
}: {
	container: HTMLElement
	input: KeyVisualFormationInput
	/** mount가 미리 읽어 둔 면 이미지. 첫 프레임이 이미지 없이 잡히지 않게 한다. */
	initialImage?: { url: string; element: p5.Image } | null
}): KeyVisualFormationRuntime {
	let currentInput = input
	let loaded = initialImage ?? null
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

			preview.background(scene.planeColor)
			if (scene.planeImage && loaded?.url === scene.planeImage) {
				drawCover(preview, loaded.element)
			}
			if (scene.dimmerOpacity > 0) {
				preview.fill(0, 0, 0, scene.dimmerOpacity * 255)
				preview.rect(0, 0, preview.width, preview.height)
			}
			preview.fill(scene.lineColor)
			for (const band of scene.bands) {
				preview.rect(band.x, band.y, band.width, band.height)
			}
		}
	}, container)

	/** 값이 바뀌어 새 이미지가 지정되면 뒤늦게 읽고, 도착하면 다시 그린다. */
	function ensureImage(url: string | null) {
		if (!url || loaded?.url === url) return
		void loadPlaneImage(url).then((dataUri) => {
			if (!dataUri || currentInput.planeImage !== url) return
			instance.loadImage(dataUri, (image) => {
				if (currentInput.planeImage !== url) return
				loaded = { url, element: image }
				instance.redraw()
			})
		})
	}

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
			ensureImage(nextInput.planeImage)
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

/** 판을 덮되 비율을 지키고 넘치는 쪽을 자른다 — CSS의 object-fit: cover와 같은 규칙. */
function drawCover(preview: p5, image: p5.Image) {
	if (!image.width || !image.height) return
	const scale = Math.max(preview.width / image.width, preview.height / image.height)
	const width = image.width * scale
	const height = image.height * scale
	preview.image(image, (preview.width - width) / 2, (preview.height - height) / 2, width, height)
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
		const input = toKeyVisualFormationInput(values)
		// 🔴 mount가 유일한 async 지점이다 — 첫 프레임이 곧 export가 될 수 있으므로 여기서 기다린다.
		const initialImage = input.planeImage ? await loadInitialImage(input.planeImage) : null
		const mounted = createKeyVisualFormationRuntime({ container, input, initialImage })
		return {
			update: (next) => mounted.update(toKeyVisualFormationInput(next)),
			resize: (width, height) => mounted.resize(width, height),
			getViewport: () => mounted.getViewport(),
			artifacts: mounted.artifacts,
			destroy: () => mounted.destroy(),
		}
	},
} satisfies GraphicRuntimeAdapter

async function loadInitialImage(url: string) {
	const dataUri = await loadPlaneImage(url)
	if (!dataUri) return null
	return await new Promise<{ url: string; element: p5.Image } | null>((resolve) => {
		// p5.loadImage는 인스턴스 메서드지만 스케치 없이도 정적 헬퍼로 쓸 수 있다.
		const sketch = new p5(() => {})
		sketch.loadImage(
			dataUri,
			(image) => {
				sketch.remove()
				resolve({ url, element: image })
			},
			() => {
				sketch.remove()
				resolve(null)
			},
		)
	})
}

export default runtime
