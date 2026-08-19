// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createShaderCanvasRuntime } from './shader-canvas.client'

/** jsdom에는 WebGL이 없다 — 이 테스트가 보는 것은 GL 결과가 아니라 canvas 표면 수명이다. */
function stubWebGl() {
	const gl = {
		VERTEX_SHADER: 1,
		FRAGMENT_SHADER: 2,
		COMPILE_STATUS: 3,
		LINK_STATUS: 4,
		ARRAY_BUFFER: 5,
		STATIC_DRAW: 6,
		FLOAT: 7,
		TRIANGLES: 8,
		getExtension: () => ({}),
		createShader: () => ({}),
		shaderSource: () => {},
		compileShader: () => {},
		getShaderParameter: () => true,
		getShaderInfoLog: () => '',
		deleteShader: () => {},
		createProgram: () => ({}),
		attachShader: () => {},
		linkProgram: () => {},
		getProgramParameter: () => true,
		getProgramInfoLog: () => '',
		deleteProgram: () => {},
		useProgram: () => {},
		createBuffer: () => ({}),
		bindBuffer: () => {},
		bufferData: () => {},
		getAttribLocation: () => 0,
		enableVertexAttribArray: () => {},
		vertexAttribPointer: () => {},
		getUniformLocation: () => ({}),
		uniform1f: () => {},
		uniform3f: () => {},
		viewport: () => {},
		drawArrays: vi.fn(),
		deleteBuffer: () => {},
	}
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
		gl as unknown as RenderingContext,
	)
	return gl
}

/** canvas.width/height 대입은 값이 같아도 드로잉 버퍼를 재할당한다 — 대입 자체를 센다. */
function countSurfaceWrites() {
	const counts = { writes: 0 }
	for (const key of ['width', 'height'] as const) {
		const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, key)
		if (!original?.set || !original.get)
			throw new Error(`canvas ${key} 접근자를 찾지 못했습니다.`)
		const { get, set } = original
		Object.defineProperty(HTMLCanvasElement.prototype, key, {
			configurable: true,
			get,
			set(value: number) {
				counts.writes += 1
				set.call(this, value)
			},
		})
	}
	return counts
}

describe('createShaderCanvasRuntime', () => {
	afterEach(() => vi.restoreAllMocks())

	async function mount() {
		stubWebGl()
		const container = document.createElement('div')
		document.body.append(container)
		const runtime = await createShaderCanvasRuntime({
			container,
			input: {},
			fragmentBody: 'void mainImage(out vec4 c, in vec2 f) { c = vec4(1.0); }',
			ariaLabel: '테스트 그래픽',
			bindUniforms: () => () => {},
		})
		return runtime
	}

	it('같은 크기로 프레임을 다시 그릴 때 드로잉 버퍼를 재할당하지 않는다', async () => {
		const runtime = await mount()
		const source = runtime.artifacts.video.source

		source.renderFrame(0, 640, 480)
		const counts = countSurfaceWrites()
		source.renderFrame(1 / 30, 640, 480)
		source.renderFrame(2 / 30, 640, 480)
		source.renderFrame(3 / 30, 640, 480)

		expect(counts.writes).toBe(0)
		runtime.destroy()
	})

	it('export 프레임을 그리는 동안 미리보기 루프를 멈추고 restore가 되켠다', async () => {
		const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame')
		const request = vi.spyOn(globalThis, 'requestAnimationFrame')
		const runtime = await mount()
		const source = runtime.artifacts.video.source

		cancel.mockClear()
		source.renderFrame(0, 640, 480)
		expect(cancel).toHaveBeenCalled()

		request.mockClear()
		source.restore()
		expect(request).toHaveBeenCalled()
		runtime.destroy()
	})
})
