import { describe, expect, it } from 'vitest'
import sweepFlutedGlassRuntimeManifest, {
	SWEEP_FLUTED_GLASS_DEFAULT_INPUT,
} from '@/features/graphic-generation/graphic-runtimes/sweep-fluted-glass/definition'
import {
	sweepFlutedGlassColorToRgb,
	sweepFlutedGlassDistortionShapeToUniform,
	toSweepFlutedGlassInput,
	toSweepFlutedGlassShaderPoint,
} from '@/features/graphic-generation/graphic-runtimes/sweep-fluted-glass/model'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'

describe('sweepFlutedGlass', () => {
	it('Controller 기본값을 shader uniform 입력으로 검증한다', () => {
		const values = createControllerValues(sweepFlutedGlassRuntimeManifest.controller.groups)
		expect(toSweepFlutedGlassInput(values)).toEqual(SWEEP_FLUTED_GLASS_DEFAULT_INPUT)
		expect(sweepFlutedGlassColorToRgb('#3dff8a')).toEqual([61 / 255, 1, 138 / 255])
	})

	it('색상 reset은 기본 블룸으로 되돌리고 범위 밖 값은 거부한다', () => {
		const values = createControllerValues(sweepFlutedGlassRuntimeManifest.controller.groups)
		expect(toSweepFlutedGlassInput({ ...values, bloomColor: null }).bloomColor).toBe(
			SWEEP_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
		)
		expect(() => toSweepFlutedGlassInput({ ...values, speed: 2.01 })).toThrow()
		expect(() => toSweepFlutedGlassInput({ ...values, sweepSpeed: 1.01 })).toThrow()
	})

	it('Controller 화면 좌표의 Y축을 WebGL 좌표로 반전한다', () => {
		expect(toSweepFlutedGlassShaderPoint({ x: -0.75, y: 0.5 })).toEqual([-0.75, -0.5])
		expect(toSweepFlutedGlassShaderPoint({ x: -0.75, y: 0.5 }, { x: -0.5, y: 0.75 })).toEqual([
			-1.25, -1.25,
		])
	})

	it('왜곡 형태를 shader 정수 uniform으로 변환한다', () => {
		expect(sweepFlutedGlassDistortionShapeToUniform('cascade')).toBe(0)
		expect(sweepFlutedGlassDistortionShapeToUniform('lens')).toBe(3)
	})

	// uniform 이름 오타는 컴파일도 통과하고 화면만 조용히 비므로 텍스트로 대조한다.
	it('shader가 선언한 uniform과 runtime이 쓰는 uniform이 정확히 일치한다', async () => {
		const { readFile } = await import('node:fs/promises')
		const [shader, runtime] = await Promise.all([
			readFile(
				'src/features/graphic-generation/graphic-runtimes/sweep-fluted-glass/shader.ts',
				'utf8',
			),
			readFile(
				'src/features/graphic-generation/graphic-runtimes/sweep-fluted-glass/runtime.client.ts',
				'utf8',
			),
		])
		const declared = Array.from(
			shader.matchAll(/^uniform\s+\w+\s+(\w+);/gm),
			(match) => match[1],
		).sort()
		const written = Array.from(
			runtime.matchAll(/getUniformLocation\(program,\s*'(\w+)'\)/g),
			(match) => match[1],
		).sort()

		expect(written).toEqual(declared)
	})
})
