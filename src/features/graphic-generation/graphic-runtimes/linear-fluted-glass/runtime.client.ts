'use client'

import type { GraphicRuntimeAdapter } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import {
	createShaderCanvasRuntime,
	type ShaderCanvasRuntime,
} from '@/features/graphic-generation/runtime/client/shader-canvas.client'
import {
	type LinearFlutedGlassInput,
	linearFlutedGlassColorToRgb,
	linearFlutedGlassDistortionShapeToUniform,
	toLinearFlutedGlassInput,
	toLinearFlutedGlassShaderPoint,
} from './model'
import fragmentBody from './shader'

export type LinearFlutedGlassRuntime = ShaderCanvasRuntime<LinearFlutedGlassInput>

/**
 * Linear Fluted Glass의 브라우저 WebGL 미리보기를 소유한다.
 * Controller 상태는 호출자가, GPU resource 수명은 공용 shader canvas host가 소유한다.
 */
export function createLinearFlutedGlassRuntime({
	container,
	input,
	ariaLabel = 'Linear Fluted Glass 그래픽 미리보기',
}: {
	container: HTMLElement
	input: LinearFlutedGlassInput
	// 세로 변형이 같은 셰이더를 재사용하므로 접근성 이름만 바꿔 단다.
	ariaLabel?: string
}): Promise<LinearFlutedGlassRuntime> {
	return createShaderCanvasRuntime({
		container,
		input,
		fragmentBody,
		ariaLabel,
		bindUniforms(gl, program) {
			const uniforms = {
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
				axisFalloff: gl.getUniformLocation(program, 'uAxisFalloff'),
				flowSpeed: gl.getUniformLocation(program, 'uFlowSpeed'),
				paletteShift: gl.getUniformLocation(program, 'uPaletteShift'),
				paletteDrift: gl.getUniformLocation(program, 'uPaletteDrift'),
				pulseIntensity: gl.getUniformLocation(program, 'uPulseIntensity'),
				pulseSpeed: gl.getUniformLocation(program, 'uPulseSpeed'),
				pulseDensity: gl.getUniformLocation(program, 'uPulseDensity'),
				pulseWidth: gl.getUniformLocation(program, 'uPulseWidth'),
				glassSize: gl.getUniformLocation(program, 'uGlassSize'),
				ribCurve: gl.getUniformLocation(program, 'uRibCurve'),
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
				distortionShape: gl.getUniformLocation(program, 'uDistortionShape'),
			}

			return (input) => {
				const [sourceX, sourceY] = toLinearFlutedGlassShaderPoint(input.source, {
					x: input.sourceOffsetX,
					y: input.sourceOffsetY,
				})
				const [glassOriginX, glassOriginY] = toLinearFlutedGlassShaderPoint(
					input.glassOriginOffset,
				)
				const [glassDriftX, glassDriftY] = toLinearFlutedGlassShaderPoint(input.glassDrift)
				gl.uniform2f(uniforms.source, sourceX, sourceY)
				gl.uniform3f(uniforms.bloomColor, ...linearFlutedGlassColorToRgb(input.bloomColor))
				gl.uniform3f(uniforms.rayColor1, ...linearFlutedGlassColorToRgb(input.rayColor1))
				gl.uniform3f(uniforms.rayColor2, ...linearFlutedGlassColorToRgb(input.rayColor2))
				gl.uniform3f(uniforms.rayColor3, ...linearFlutedGlassColorToRgb(input.rayColor3))
				gl.uniform3f(uniforms.rayColor4, ...linearFlutedGlassColorToRgb(input.rayColor4))
				gl.uniform3f(uniforms.rayColor5, ...linearFlutedGlassColorToRgb(input.rayColor5))
				gl.uniform3f(
					uniforms.rayBackgroundColor,
					...linearFlutedGlassColorToRgb(input.rayBackgroundColor),
				)
				gl.uniform1f(uniforms.rayBloom, input.rayBloom)
				gl.uniform1f(uniforms.rayIntensity, input.rayIntensity)
				gl.uniform1f(uniforms.rayDensity, input.rayDensity)
				gl.uniform1f(uniforms.raySpotty, input.raySpotty)
				gl.uniform1f(uniforms.rayMidSize, input.rayMidSize)
				gl.uniform1f(uniforms.rayMidIntensity, input.rayMidIntensity)
				gl.uniform1f(uniforms.speed, input.speed)
				gl.uniform1f(uniforms.frameOffsetMs, input.frameOffsetMs)
				gl.uniform1f(uniforms.rayScale, input.rayScale)
				gl.uniform1f(uniforms.rayRotation, input.rayRotation)
				gl.uniform1f(uniforms.axisFalloff, input.axisFalloff)
				gl.uniform1f(uniforms.flowSpeed, input.flowSpeed)
				gl.uniform1f(uniforms.paletteShift, input.paletteShift)
				gl.uniform1f(uniforms.paletteDrift, input.paletteDrift)
				gl.uniform1f(uniforms.pulseIntensity, input.pulseIntensity)
				gl.uniform1f(uniforms.pulseSpeed, input.pulseSpeed)
				gl.uniform1f(uniforms.pulseDensity, input.pulseDensity)
				gl.uniform1f(uniforms.pulseWidth, input.pulseWidth)
				gl.uniform1f(uniforms.glassSize, input.glassSize)
				gl.uniform1f(uniforms.ribCurve, input.ribCurve)
				gl.uniform1f(uniforms.glassAngle, input.glassAngle)
				gl.uniform2f(uniforms.glassOriginOffset, glassOriginX, glassOriginY)
				gl.uniform1f(uniforms.glassOffset, input.glassOffset)
				gl.uniform1f(uniforms.glassSpeed, input.glassSpeed)
				gl.uniform2f(uniforms.glassDrift, glassDriftX, glassDriftY)
				gl.uniform2f(
					uniforms.glassDriftSpeed,
					input.glassDriftSpeedX,
					input.glassDriftSpeedY,
				)
				gl.uniform1f(uniforms.glassDistortion, input.glassDistortion)
				gl.uniform1f(uniforms.glassEdgeSoftness, input.glassEdgeSoftness)
				gl.uniform1f(uniforms.glassBlur, input.glassBlur)
				gl.uniform1f(uniforms.glassScattering, input.glassScattering)
				gl.uniform1f(uniforms.glassHighlights, input.glassHighlights)
				gl.uniform1f(uniforms.glassShadows, input.glassShadows)
				gl.uniform1i(
					uniforms.distortionShape,
					linearFlutedGlassDistortionShapeToUniform(input.distortionShape),
				)
			}
		},
	})
}

const linearFlutedGlassRuntimeAdapter = {
	type: 'shader',
	async mount({ container, values }) {
		const runtime = await createLinearFlutedGlassRuntime({
			container,
			input: toLinearFlutedGlassInput(values),
		})
		return {
			update: (next) => runtime.update(toLinearFlutedGlassInput(next)),
			resize: (width, height) => runtime.resize(width, height),
			getViewport: () => runtime.getViewport(),
			artifacts: runtime.artifacts,
			destroy: () => runtime.destroy(),
		}
	},
} satisfies GraphicRuntimeAdapter

export default linearFlutedGlassRuntimeAdapter
