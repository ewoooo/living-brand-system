'use client'

import {
	createGraphicRasterArtifact,
	type GraphicRuntimeAdapter,
} from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import type {
	CanvasVideoSource,
	RasterArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import {
	type RadialFlutedGlassInput,
	radialFlutedGlassColorToRgb,
	radialFlutedGlassDistortionShapeToUniform,
	toRadialFlutedGlassInput,
	toRadialFlutedGlassShaderPoint,
} from './model'

const SHADER_URL = '/shaders/radial-fluted-glass.glsl'
const VERTEX_SHADER = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`

export type RadialFlutedGlassRuntime = {
	update(input: RadialFlutedGlassInput): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	artifacts: {
		raster: RasterArtifact
		video: VideoArtifact<CanvasVideoSource>
	}
	destroy(): void
}

/**
 * Radial Fluted Glass의 브라우저 WebGL 미리보기를 소유한다.
 * Controller 상태는 호출자가, shader asset I/O와 GPU resource 수명은 이 모듈이 소유한다.
 */
export async function createRadialFlutedGlassRuntime({
	container,
	input,
}: {
	container: HTMLElement
	input: RadialFlutedGlassInput
}): Promise<RadialFlutedGlassRuntime> {
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
	// ponytail: preview resolution stays at CSS pixels; add a quality control only when profiling supports high-DPI preview.
	const pixelRatio = 1
	const uniforms = {
		resolution: gl.getUniformLocation(program, 'iResolution'),
		time: gl.getUniformLocation(program, 'iTime'),
		source: gl.getUniformLocation(program, 'uSource'),
		bloomColor: gl.getUniformLocation(program, 'uBloomColor'),
		rayColor1: gl.getUniformLocation(program, 'uRayColor1'),
		rayColor2: gl.getUniformLocation(program, 'uRayColor2'),
		rayColor3: gl.getUniformLocation(program, 'uRayColor3'),
		rayColor4: gl.getUniformLocation(program, 'uRayColor4'),
		rayColor5: gl.getUniformLocation(program, 'uRayColor5'),
		rayBackgroundColor: gl.getUniformLocation(program, 'uRayBackgroundColor'),
		rayBloom: gl.getUniformLocation(program, 'uRayBloom'),
		rayIntensity: gl.getUniformLocation(program, 'uGodrayIntensity'),
		rayDensity: gl.getUniformLocation(program, 'uGodrayDensity'),
		raySpotty: gl.getUniformLocation(program, 'uRaySpotty'),
		rayMidSize: gl.getUniformLocation(program, 'uRayMidSize'),
		rayMidIntensity: gl.getUniformLocation(program, 'uRayMidIntensity'),
		speed: gl.getUniformLocation(program, 'uGodraySpeed'),
		frameOffsetMs: gl.getUniformLocation(program, 'uFrameOffsetMs'),
		rayScale: gl.getUniformLocation(program, 'uRayScale'),
		rayRotation: gl.getUniformLocation(program, 'uRayRotation'),
		radialFalloff: gl.getUniformLocation(program, 'uRadialFalloff'),
		radialFlowSpeed: gl.getUniformLocation(program, 'uRadialFlowSpeed'),
		pulseIntensity: gl.getUniformLocation(program, 'uPulseIntensity'),
		pulseSpeed: gl.getUniformLocation(program, 'uPulseSpeed'),
		pulseDensity: gl.getUniformLocation(program, 'uPulseDensity'),
		pulseWidth: gl.getUniformLocation(program, 'uPulseWidth'),
		glassSize: gl.getUniformLocation(program, 'uGlassSize'),
		glassAngle: gl.getUniformLocation(program, 'uGlassAngle'),
		glassOriginOffset: gl.getUniformLocation(program, 'uGlassOriginOffset'),
		glassOffset: gl.getUniformLocation(program, 'uGlassOffset'),
		glassSpeed: gl.getUniformLocation(program, 'uGlassSpeed'),
		glassDrift: gl.getUniformLocation(program, 'uGlassDrift'),
		glassDriftSpeed: gl.getUniformLocation(program, 'uGlassDriftSpeed'),
		glassDistortion: gl.getUniformLocation(program, 'uGlassDistortion'),
		glassEdgeSoftness: gl.getUniformLocation(program, 'uGlassEdgeSoftness'),
		glassBlur: gl.getUniformLocation(program, 'uGlassBlur'),
		glassScattering: gl.getUniformLocation(program, 'uGlassScattering'),
		glassHighlights: gl.getUniformLocation(program, 'uGlassHighlights'),
		glassShadows: gl.getUniformLocation(program, 'uGlassShadows'),
		glassSourceFade: gl.getUniformLocation(program, 'uGlassSourceFade'),
		distortionShape: gl.getUniformLocation(program, 'uDistortionShape'),
	}

	function draw(time: number) {
		currentTime = time
		const [sourceX, sourceY] = toRadialFlutedGlassShaderPoint(currentInput.source)
		const [glassOriginX, glassOriginY] = toRadialFlutedGlassShaderPoint(
			currentInput.glassOriginOffset,
		)
		const [glassDriftX, glassDriftY] = toRadialFlutedGlassShaderPoint(currentInput.glassDrift)
		gl.viewport(0, 0, canvas.width, canvas.height)
		gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1)
		gl.uniform1f(uniforms.time, time)
		gl.uniform2f(uniforms.source, sourceX, sourceY)
		setUniformColor(gl, uniforms.bloomColor, currentInput.bloomColor)
		setUniformColor(gl, uniforms.rayColor1, currentInput.rayColor1)
		setUniformColor(gl, uniforms.rayColor2, currentInput.rayColor2)
		setUniformColor(gl, uniforms.rayColor3, currentInput.rayColor3)
		setUniformColor(gl, uniforms.rayColor4, currentInput.rayColor4)
		setUniformColor(gl, uniforms.rayColor5, currentInput.rayColor5)
		setUniformColor(gl, uniforms.rayBackgroundColor, currentInput.rayBackgroundColor)
		gl.uniform1f(uniforms.rayBloom, currentInput.rayBloom)
		gl.uniform1f(uniforms.rayIntensity, currentInput.rayIntensity)
		gl.uniform1f(uniforms.rayDensity, currentInput.rayDensity)
		gl.uniform1f(uniforms.raySpotty, currentInput.raySpotty)
		gl.uniform1f(uniforms.rayMidSize, currentInput.rayMidSize)
		gl.uniform1f(uniforms.rayMidIntensity, currentInput.rayMidIntensity)
		gl.uniform1f(uniforms.speed, currentInput.speed)
		gl.uniform1f(uniforms.frameOffsetMs, currentInput.frameOffsetMs)
		gl.uniform1f(uniforms.rayScale, currentInput.rayScale)
		gl.uniform1f(uniforms.rayRotation, currentInput.rayRotation)
		gl.uniform1f(uniforms.radialFalloff, currentInput.radialFalloff)
		gl.uniform1f(uniforms.radialFlowSpeed, currentInput.radialFlowSpeed)
		gl.uniform1f(uniforms.pulseIntensity, currentInput.pulseIntensity)
		gl.uniform1f(uniforms.pulseSpeed, currentInput.pulseSpeed)
		gl.uniform1f(uniforms.pulseDensity, currentInput.pulseDensity)
		gl.uniform1f(uniforms.pulseWidth, currentInput.pulseWidth)
		gl.uniform1f(uniforms.glassSize, currentInput.glassSize)
		gl.uniform1f(uniforms.glassAngle, currentInput.glassAngle)
		gl.uniform2f(uniforms.glassOriginOffset, glassOriginX, glassOriginY)
		gl.uniform1f(uniforms.glassOffset, currentInput.glassOffset)
		gl.uniform1f(uniforms.glassSpeed, currentInput.glassSpeed)
		gl.uniform2f(uniforms.glassDrift, glassDriftX, glassDriftY)
		gl.uniform2f(
			uniforms.glassDriftSpeed,
			currentInput.glassDriftSpeedX,
			currentInput.glassDriftSpeedY,
		)
		gl.uniform1f(uniforms.glassDistortion, currentInput.glassDistortion)
		gl.uniform1f(uniforms.glassEdgeSoftness, currentInput.glassEdgeSoftness)
		gl.uniform1f(uniforms.glassBlur, currentInput.glassBlur)
		gl.uniform1f(uniforms.glassScattering, currentInput.glassScattering)
		gl.uniform1f(uniforms.glassHighlights, currentInput.glassHighlights)
		gl.uniform1f(uniforms.glassShadows, currentInput.glassShadows)
		gl.uniform2f(
			uniforms.glassSourceFade,
			currentInput.glassSourceFadeStart,
			currentInput.glassSourceFadeEnd,
		)
		gl.uniform1i(
			uniforms.distortionShape,
			radialFlutedGlassDistortionShapeToUniform(currentInput.distortionShape),
		)
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

const radialFlutedGlassRuntimeAdapter = {
	type: 'shader',
	async mount({ container, values }) {
		const runtime = await createRadialFlutedGlassRuntime({
			container,
			input: toRadialFlutedGlassInput(values),
		})
		return {
			update: (next) => runtime.update(toRadialFlutedGlassInput(next)),
			resize: (width, height) => runtime.resize(width, height),
			getViewport: () => runtime.getViewport(),
			artifacts: runtime.artifacts,
			destroy: () => runtime.destroy(),
		}
	},
} satisfies GraphicRuntimeAdapter

export default radialFlutedGlassRuntimeAdapter

function setUniformColor(
	gl: WebGLRenderingContext,
	location: WebGLUniformLocation | null,
	color: string,
) {
	const [red, green, blue] = radialFlutedGlassColorToRgb(color)
	gl.uniform3f(location, red, green, blue)
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
