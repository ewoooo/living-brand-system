'use client'

import { type RadialFlutedGlassInput, radialFlutedGlassColorToRgb } from './radial-fluted-glass'

const SHADER_URL = '/shaders/radial-fluted-glass.glsl'
const VERTEX_SHADER = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`

export type RadialFlutedGlassPreview = {
	update(input: RadialFlutedGlassInput): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	destroy(): void
}

/**
 * Radial Fluted Glass의 브라우저 WebGL 미리보기를 소유한다.
 * Controller 상태는 호출자가, shader asset I/O와 GPU resource 수명은 이 모듈이 소유한다.
 */
export async function createRadialFlutedGlassPreview({
	container,
	input,
}: {
	container: HTMLElement
	input: RadialFlutedGlassInput
}): Promise<RadialFlutedGlassPreview> {
	const response = await fetch(SHADER_URL)
	if (!response.ok) throw new Error(`Shader asset을 불러오지 못했습니다: ${response.status}`)
	const fragmentBody = await response.text()
	const canvas = document.createElement('canvas')
	canvas.className = 'block h-full w-full'
	canvas.setAttribute('role', 'img')
	canvas.setAttribute('aria-label', 'Radial Fluted Glass 그래픽 미리보기')
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

	let currentInput = input
	let currentTime = 0
	let animationFrame = 0
	let viewport = { width: 1, height: 1 }
	const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
	// ponytail: preview density is capped at 2; raise it only if high-DPI export shares this path.
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
	const uniforms = {
		resolution: gl.getUniformLocation(program, 'iResolution'),
		time: gl.getUniformLocation(program, 'iTime'),
		source: gl.getUniformLocation(program, 'uSource'),
		bloomColor: gl.getUniformLocation(program, 'uBloomColor'),
		rayIntensity: gl.getUniformLocation(program, 'uGodrayIntensity'),
		rayDensity: gl.getUniformLocation(program, 'uGodrayDensity'),
		speed: gl.getUniformLocation(program, 'uGodraySpeed'),
		glassSize: gl.getUniformLocation(program, 'uGlassSize'),
		glassDistortion: gl.getUniformLocation(program, 'uGlassDistortion'),
	}

	function draw(time: number) {
		currentTime = time
		const [red, green, blue] = radialFlutedGlassColorToRgb(currentInput.bloomColor)
		gl.viewport(0, 0, canvas.width, canvas.height)
		gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1)
		gl.uniform1f(uniforms.time, time)
		gl.uniform2f(uniforms.source, currentInput.source.x, currentInput.source.y)
		gl.uniform3f(uniforms.bloomColor, red, green, blue)
		gl.uniform1f(uniforms.rayIntensity, currentInput.rayIntensity)
		gl.uniform1f(uniforms.rayDensity, currentInput.rayDensity)
		gl.uniform1f(uniforms.speed, currentInput.speed)
		gl.uniform1f(uniforms.glassSize, currentInput.glassSize)
		gl.uniform1f(uniforms.glassDistortion, currentInput.glassDistortion)
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

	return {
		update(nextInput) {
			currentInput = nextInput
			if (reducedMotion) draw(0)
		},
		resize,
		getViewport: () => viewport,
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
