import { describe, expect, it } from 'vitest'
import flutedGlassRuntimeManifest, {
	FLUTED_GLASS_SHAPE_INPUTS,
	FLUTED_GLASS_SHAPES,
	FLUTED_GLASS_STYLE_IDS,
	FLUTED_GLASS_STYLES,
} from '@/features/graphic-generation/graphic-runtimes/fluted-glass/definition'
import {
	flutedGlassColorToRgb,
	flutedGlassDistortionShapeToUniform,
	toFlutedGlassInput,
	toFlutedGlassShaderPoint,
} from '@/features/graphic-generation/graphic-runtimes/fluted-glass/model'
import {
	type ControllerGroupDefinition,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

const SHADER_DIR = 'src/features/graphic-generation/graphic-runtimes/fluted-glass'

describe('flutedGlass', () => {
	const groups: readonly ControllerGroupDefinition[] =
		flutedGlassRuntimeManifest.controller.groups
	const controls = groups.flatMap((group) => group.controls)
	const defaults = () => createControllerValues(groups)

	it('네 모양을 셰이더 묶음 둘로 나눠 그린다', () => {
		expect(FLUTED_GLASS_SHAPES).toEqual(['linear', 'vertical', 'sweep', 'radial'])
		for (const shape of FLUTED_GLASS_SHAPES) {
			const resolved = toFlutedGlassInput({ ...defaults(), shape })
			expect(resolved.shape, shape).toBe(shape)
			expect(resolved.family, shape).toBe(shape === 'vertical' ? 'linear' : shape)
		}
	})

	it('모양이 자기 기하를 정한다 — 가로는 눕고 세로는 선다', () => {
		const linear = toFlutedGlassInput({ ...defaults(), shape: 'linear' }).input
		const vertical = toFlutedGlassInput({ ...defaults(), shape: 'vertical' }).input
		expect(linear.rayRotation).toBe(0)
		expect(linear.glassAngle).toBe(0)
		expect(vertical.rayRotation).toBe(-90)
		expect(vertical.glassAngle).toBe(90)
	})

	it('방사는 광선 밭이 돌지 않는다 — 스윕 속도 0이 그 뜻이다', () => {
		const radial = toFlutedGlassInput({ ...defaults(), shape: 'radial' })
		const sweep = toFlutedGlassInput({ ...defaults(), shape: 'sweep' })
		expect(radial.family === 'radial' && radial.input.sweepSpeed).toBe(0)
		expect(sweep.family === 'sweep' && sweep.input.sweepSpeed).toBe(
			FLUTED_GLASS_SHAPE_INPUTS.sweep.sweepSpeed,
		)
	})

	it('색 조합은 모양과 독립이다 — 모양을 바꿔도 따라오지 않는다', () => {
		const values = { ...defaults(), rayColor1: '#123456', speed: 1.11 }
		for (const shape of FLUTED_GLASS_SHAPES) {
			const { input } = toFlutedGlassInput({ ...values, shape })
			expect(input.rayColor1, shape).toBe('#123456')
			expect(input.speed, shape).toBe(1.11)
		}
		// 만지지 않으면 네 모양이 같은 조합 하나를 쓴다.
		const untouched = FLUTED_GLASS_SHAPES.map(
			(shape) => toFlutedGlassInput({ ...defaults(), shape }).input.rayColor1,
		)
		expect(new Set(untouched).size).toBe(1)
	})

	it('스타일이 만지지 않은 잔 축을 정한다 — 가로·세로만 스타일을 갖는다', () => {
		const focused = toFlutedGlassInput({ ...defaults(), shape: 'linear', preset: 'focused' })
		expect(focused.family === 'linear' && focused.input.axisFalloff).toBe(
			FLUTED_GLASS_STYLES.linear.focused.axisFalloff,
		)
		// 🔴 이 축은 컨트롤로도 선언돼 있다 — 만지지 않았으면 스타일이 이겨야 한다.
		expect(focused.input.rayDensity).toBe(FLUTED_GLASS_STYLES.linear.focused.rayDensity)
		expect(focused.input.glassBlur).toBe(FLUTED_GLASS_STYLES.linear.focused.glassBlur)

		// 스윕·방사는 스타일이 없다 — 골라도 모양 기본값 그대로다.
		for (const shape of ['sweep', 'radial'] as const) {
			const styled = toFlutedGlassInput({ ...defaults(), shape, preset: 'focused' })
			expect(styled.input.rayDensity, shape).toBe(FLUTED_GLASS_SHAPE_INPUTS[shape].rayDensity)
		}
	})

	it('창작자가 만진 잔 축은 스타일이 덮지 않는다', () => {
		const { input } = toFlutedGlassInput({
			...defaults(),
			shape: 'linear',
			preset: 'focused',
			rayDensity: 0.77,
		})
		expect(input.rayDensity).toBe(0.77)
	})

	it('알 수 없는 모양·스타일은 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다', () => {
		expect(toFlutedGlassInput({ ...defaults(), shape: 'no-such-shape' }).shape).toBe('sweep')
		const styled = toFlutedGlassInput({
			...defaults(),
			shape: 'linear',
			preset: 'no-such-style',
		})
		expect(styled.input.rayDensity).toBe(FLUTED_GLASS_SHAPE_INPUTS.linear.rayDensity)
	})

	it('모양·스타일 select이 목록을 그대로 담는다', () => {
		const options = (id: string) => {
			const control = controls.find((candidate) => candidate.id === id)
			return control && 'options' in control ? control.options.map((o) => o.value) : null
		}
		expect(options('shape')).toEqual([...FLUTED_GLASS_SHAPES])
		expect(options('preset')).toEqual([...FLUTED_GLASS_STYLE_IDS])
	})

	it('모양은 다시 마운트해야 하는 축으로 선언된다 — uniform으로는 반영되지 않는다', () => {
		expect(flutedGlassRuntimeManifest.controller.remountOn).toEqual(['shape'])
	})

	it('네 모양의 축 집합이 달라도 합집합 컨트롤이 입력을 깨지 않는다', () => {
		// sweepSpeed는 가로에 없는 축이다 — 값을 밀어 넣어도 strictObject가 거부하지 않아야 한다.
		expect(() =>
			toFlutedGlassInput({ ...defaults(), shape: 'linear', sweepSpeed: 0.5 }),
		).not.toThrow()
		expect(() =>
			toFlutedGlassInput({ ...defaults(), shape: 'sweep', ribCurve: 2 }),
		).not.toThrow()
	})

	it('범위 밖 값은 거부한다', () => {
		expect(() => toFlutedGlassInput({ ...defaults(), speed: 2.01 })).toThrow()
		expect(() => toFlutedGlassInput({ ...defaults(), sourceOffsetX: 2.01 })).toThrow()
	})

	it('색상 reset은 모양이 아니라 그 하나의 색 조합으로 되돌아간다', () => {
		// 🔴 가로의 자기 기본 색(#001a0b…)으로 떨어지면 「색 조합」이 모양에 묶여 버린다.
		for (const shape of FLUTED_GLASS_SHAPES) {
			const { input } = toFlutedGlassInput({
				...defaults(),
				shape,
				bloomColor: null,
				rayColor1: null,
			})
			expect(input.bloomColor, shape).toBe(FLUTED_GLASS_SHAPE_INPUTS.sweep.bloomColor)
			expect(input.rayColor1, shape).toBe(FLUTED_GLASS_SHAPE_INPUTS.sweep.rayColor1)
		}
		expect(flutedGlassColorToRgb('#3dff8a')).toEqual([61 / 255, 1, 138 / 255])
	})

	it('Controller 화면 좌표의 Y축을 WebGL 좌표로 반전한다', () => {
		expect(toFlutedGlassShaderPoint({ x: -0.75, y: 0.5 })).toEqual([-0.75, -0.5])
		expect(toFlutedGlassShaderPoint({ x: -0.75, y: 0.5 }, { x: -0.5, y: 0.75 })).toEqual([
			-1.25, -1.25,
		])
	})

	it('왜곡 형태를 shader 정수 uniform으로 변환한다', () => {
		expect(flutedGlassDistortionShapeToUniform('cascade')).toBe(0)
		expect(flutedGlassDistortionShapeToUniform('lens')).toBe(3)
	})

	// uniform 이름 오타는 컴파일도 통과하고 화면만 조용히 비므로 텍스트로 대조한다.
	it('세 셰이더가 선언한 uniform과 runtime이 배선하는 uniform이 서로를 덮는다', async () => {
		const { readFile } = await import('node:fs/promises')
		const read = (file: string) => readFile(`${SHADER_DIR}/${file}`, 'utf8')
		const [linear, sweep, radial, runtime] = await Promise.all([
			read('shader.linear.ts'),
			read('shader.sweep.ts'),
			read('shader.radial.ts'),
			read('runtime.client.ts'),
		])
		const declared = (source: string) =>
			new Set(Array.from(source.matchAll(/^uniform\s+\w+\s+(\w+);/gm), (m) => m[1]))
		const written = new Set(
			Array.from(runtime.matchAll(/getUniformLocation\(program,\s*'(\w+)'\)/g), (m) => m[1]),
		)
		const shaders = {
			linear: declared(linear),
			sweep: declared(sweep),
			radial: declared(radial),
		}

		// 선언했는데 배선되지 않은 uniform은 그 축이 죽은 것이다.
		for (const [name, names] of Object.entries(shaders)) {
			expect([...names].filter((id) => !written.has(id)).sort(), name).toEqual([])
		}
		// 배선했는데 어느 셰이더에도 없는 이름은 오타다.
		const anyShader = new Set(Object.values(shaders).flatMap((names) => [...names]))
		expect([...written].filter((id) => !anyShader.has(id)).sort()).toEqual([])
		// 방사에만 없는 uniform은 스윕 회전 하나다 — 배선을 공유하고 WebGL이 null 대입을 무시한다.
		expect([...shaders.sweep].filter((id) => !shaders.radial.has(id)).sort()).toEqual([
			'uSweepSpeed',
		])
	})
})
