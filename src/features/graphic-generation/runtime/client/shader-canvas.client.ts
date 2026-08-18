'use client'

import type {
	CanvasVideoSource,
	RasterArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import { createGraphicRasterArtifact } from './graphic-runtime.client'

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`

export type ShaderCanvasRuntime<Input> = {
	update(input: Input): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	artifacts: {
		raster: RasterArtifact
		video: VideoArtifact<CanvasVideoSource>
	}
	destroy(): void
}

/**
 * Shader Graphic runtime의 shader asset I/O, GPU resource 수명, 프레임 루프, Artifact 노출을 소유한다.
 * uniform의 의미와 이름은 호출자가 `bindUniforms`로 소유한다.
 */
export async function createShaderCanvasRuntime<Input>({
	container,
	fragmentBody,
	ariaLabel,
	input,
	bindUniforms,
}: {
	container: HTMLElement
	fragmentBody: string
	ariaLabel: string
	input: Input
	bindUniforms: (gl: WebGLRenderingContext, program: WebGLProgram) => (input: Input) => void
}): Promise<ShaderCanvasRuntime<Input>> {
	const canvas = document.createElement('canvas')
	canvas.className = 'block h-full w-full'
	canvas.setAttribute('role', 'img')
	canvas.setAttribute('aria-label', ariaLabel)
	const context = canvas.getContext('webgl', { alpha: false, antialias: false })
	if (!context) throw new Error('WebGL을 사용할 수 없습니다.')
	const gl: WebGLRenderingContext = context
	if (!gl.getExtension('OES_standard_derivatives')) {
		throw new Error('필요한 WebGL derivative extension을 사용할 수 없습니다.')
	}

	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
	let fragmentShader: WebGLShader | null = null
	let program: WebGLProgram | null = null
	let buffer: WebGLBuffer | null = null
	try {
		fragmentShader = compileShader(
			gl,
			gl.FRAGMENT_SHADER,
			`#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
${fragmentBody}
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
`,
		)
		program = linkProgram(gl, vertexShader, fragmentShader)
		buffer = gl.createBuffer()
		if (!buffer) throw new Error('WebGL buffer를 만들지 못했습니다.')
	} catch (error) {
		gl.deleteShader(vertexShader)
		if (fragmentShader) gl.deleteShader(fragmentShader)
		if (program) gl.deleteProgram(program)
		throw error
	}

	// biome-ignore lint/correctness/useHookAtTopLevel: WebGL API method, not a React hook.
	gl.useProgram(program)
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
	const position = gl.getAttribLocation(program, 'position')
	if (position < 0) throw new Error('WebGL position attribute를 찾지 못했습니다.')
	gl.enableVertexAttribArray(position)
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)
	container.append(canvas)

	const writeUniforms = bindUniforms(gl, program)
	const resolutionUniform = gl.getUniformLocation(program, 'iResolution')
	const timeUniform = gl.getUniformLocation(program, 'iTime')

	let currentInput = input
	let currentTime = 0
	let animationFrame = 0
	let viewport = { width: 1, height: 1 }
	const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
	// ponytail: preview resolution stays at CSS pixels; add a quality control only when profiling supports high-DPI preview.
	const pixelRatio = 1

	function draw(time: number) {
		currentTime = time
		gl.viewport(0, 0, canvas.width, canvas.height)
		gl.uniform3f(resolutionUniform, canvas.width, canvas.height, 1)
		gl.uniform1f(timeUniform, time)
		writeUniforms(currentInput)
		gl.drawArrays(gl.TRIANGLES, 0, 3)
	}

	function animate(milliseconds: number) {
		draw(milliseconds / 1000)
		animationFrame = requestAnimationFrame(animate)
	}

	function resize(width: number, height: number) {
		viewport = {
			width: Math.max(1, Math.floor(width)),
			height: Math.max(1, Math.floor(height)),
		}
		canvas.width = Math.max(1, Math.floor(width * pixelRatio))
		canvas.height = Math.max(1, Math.floor(height * pixelRatio))
		draw(currentTime)
	}

	resize(container.clientWidth, container.clientHeight)
	if (!reducedMotion) animationFrame = requestAnimationFrame(animate)
	const restore = () => resize(viewport.width, viewport.height)
	const raster = createGraphicRasterArtifact({
		canvas,
		getViewport: () => viewport,
		render(width, height) {
			canvas.width = Math.max(1, Math.floor(width))
			canvas.height = Math.max(1, Math.floor(height))
			draw(currentTime)
		},
	})
	const videoSource: CanvasVideoSource = {
		canvas,
		renderFrame(timeSeconds, width, height) {
			const previewTime = currentTime
			canvas.width = Math.max(1, Math.floor(width))
			canvas.height = Math.max(1, Math.floor(height))
			draw(timeSeconds)
			currentTime = previewTime
		},
		restore,
	}

	return {
		update(nextInput) {
			currentInput = nextInput
			if (reducedMotion) draw(0)
		},
		resize,
		getViewport: () => viewport,
		artifacts: {
			raster,
			video: { kind: 'video', source: videoSource },
		},
		destroy() {
			cancelAnimationFrame(animationFrame)
			gl.deleteBuffer(buffer)
			gl.deleteProgram(program)
			canvas.remove()
		},
	}
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)
	if (!shader) throw new Error('WebGL shader를 만들지 못했습니다.')
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader) ?? '알 수 없는 컴파일 오류'
		gl.deleteShader(shader)
		throw new Error(`WebGL shader 컴파일 실패: ${log}`)
	}
	return shader
}

function linkProgram(
	gl: WebGLRenderingContext,
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader,
) {
	const program = gl.createProgram()
	if (!program) throw new Error('WebGL program을 만들지 못했습니다.')
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program) ?? '알 수 없는 링크 오류'
		gl.deleteProgram(program)
		throw new Error(`WebGL program 링크 실패: ${log}`)
	}
	return program
}
