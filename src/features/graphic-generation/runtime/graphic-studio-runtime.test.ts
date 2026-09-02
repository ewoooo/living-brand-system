import { describe, expect, it } from 'vitest'
import {
	parseGraphicRuntimeManifest,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	deriveGraphicStudioConfig,
	graphicRuntimeManifests,
	resolveGraphicStudioOutput,
} from '@/features/graphic-generation/domain/graphic-studio-manifest'
import forwardStraightRuntimeManifest from '@/features/graphic-generation/graphic-runtimes/forward-straight/definition'
import radialFlutedGlassRuntimeManifest from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'
import { createGraphicStudioPluginCatalog } from './graphic-plugin'
import {
	getGraphicStudioRuntimeBindings,
	getGraphicStudioVectorArtifact,
	hasGraphicStudioVectorArtifact,
} from './graphic-studio-runtime'

const config = forwardStraightRuntimeManifest

describe('graphicStudioRuntime', () => {
	it('Graphic 계약을 멱등하게 검증하고 잘못된 studio·type을 거부한다', () => {
		expect(parseGraphicRuntimeManifest(parseGraphicRuntimeManifest(config))).toBe(config)
		const effective = { ...config, output: resolveGraphicStudioOutput(config) }
		expect(effective.output.formats).toEqual(['png', 'jpeg', 'tiff', 'pdf', 'svg', 'mp4'])
		expect(resolveGraphicStudioOutput(radialFlutedGlassRuntimeManifest).formats).toEqual([
			'png',
			'jpeg',
			'tiff',
			'pdf',
			'mp4',
		])
		expect(
			parseGraphicStudioConfig({
				...effective,
				output: { ...effective.output, formats: ['png'] },
			}).output.formats,
		).toEqual(['png'])
		const radial = {
			...radialFlutedGlassRuntimeManifest,
			output: resolveGraphicStudioOutput(radialFlutedGlassRuntimeManifest),
		}
		expect(() => parseGraphicStudioConfig({ ...radial, output: { formats: ['svg'] } })).toThrow(
			'지원하지 않는 output format',
		)
		expect(() => parseGraphicRuntimeManifest({ ...config, studio: 'image' })).toThrow('studio')
		expect(() => parseGraphicRuntimeManifest({ ...config, type: 'canvas' })).toThrow('type')
		expect(() => parseGraphicRuntimeManifest({ ...config, unknown: true })).toThrow(
			'알 수 없는',
		)
	})

	it('plugin catalog가 config·Vector Artifact projector·명시적 binding을 함께 제공한다', () => {
		expect(graphicRuntimeManifests).toContain(config)
		expect(config.artifacts).toEqual({ vector: {}, raster: {} })
		const values = createControllerValues(config.controller.groups)
		expect(
			getGraphicStudioVectorArtifact(config, values, { width: 800, height: 600 }),
		).toMatchObject({ kind: 'vector', source: { width: 800, height: 600 } })
		expect(getGraphicStudioRuntimeBindings(config, { width: 800, height: 600 })).toEqual({
			origin: { padAspectRatio: 4 / 3 },
		})
	})

	it('Shader runtime은 browser artifact만 등록하고 Vector 합성에서는 제외한다', () => {
		const shaderConfig = radialFlutedGlassRuntimeManifest
		const values = createControllerValues(shaderConfig.controller.groups)

		expect(graphicRuntimeManifests).toContain(shaderConfig)
		expect(shaderConfig.artifacts).toEqual({
			raster: {},
			video: {
				fps: [24, 30, 60],
				maxDurationSeconds: 10,
				maxHeight: 1080,
				maxWidth: 1920,
			},
		})
		expect(
			getGraphicStudioVectorArtifact(shaderConfig, values, { width: 800, height: 600 }),
		).toBeNull()
		expect(hasGraphicStudioVectorArtifact(shaderConfig)).toBe(false)
		expect(hasGraphicStudioVectorArtifact(config)).toBe(true)
		expect(getGraphicStudioRuntimeBindings(shaderConfig, { width: 800, height: 600 })).toEqual({
			source: { padAspectRatio: 4 / 3 },
			glassOriginOffset: { padAspectRatio: 4 / 3 },
			glassDrift: { padAspectRatio: 4 / 3 },
		})
	})

	it('미등록 id와 type mismatch를 fail-closed한다', () => {
		const values = createControllerValues(config.controller.groups)
		for (const unsupported of [
			{ ...config, id: 'missing' },
			{ ...config, type: 'shader' as const },
		]) {
			expect(
				getGraphicStudioVectorArtifact(unsupported, values, { width: 800, height: 600 }),
			).toBeNull()
			expect(
				getGraphicStudioRuntimeBindings(unsupported, { width: 800, height: 600 }),
			).toEqual({})
		}
	})

	it('유효하지 않은 viewport에는 기하 binding을 만들지 않는다', () => {
		expect(getGraphicStudioRuntimeBindings(config, { width: 0, height: 600 })).toEqual({})
		expect(getGraphicStudioRuntimeBindings(config, { width: 800, height: 0 })).toEqual({})
	})

	it('기본 선언이 없는 런타임은 controller에 그 키를 싣지 않는다', () => {
		const derived = deriveGraphicStudioConfig({
			id: 13,
			name: '선언 없음',
			runtime: 'forward-straight',
		})

		// 🔴 undefined를 그대로 실으면 JSON 직렬화 검사에서 프로파일 전체가 거부된다.
		expect('basic' in derived.controller).toBe(false)
	})

	it('🔴 지금은 어느 런타임도 기본 컨트롤을 선언하지 않는다 — 화면이 예전 그대로여야 한다', () => {
		// 무엇을 기본으로 남길지는 아직 정하지 않았다. 선언이 생기면 이 테스트가 먼저 깨져,
		// 「일부 프로파일만 달라 보이는 상태」로 조용히 머지되는 것을 막는다.
		// 선언이 하나도 없어 리터럴 타입에 `basic` 키가 없다 — 계약 기준으로 본다.
		const declared = graphicRuntimeManifests.filter(
			(manifest) =>
				(manifest.controller as { basic?: readonly string[] }).basic !== undefined,
		)

		expect(declared.map((manifest) => manifest.id)).toEqual([])
	})

	it('published Graphic Profile은 Restrictions로 Runtime Manifest를 좁히고 미등록 runtime을 거부한다', () => {
		const profile = {
			id: 9,
			name: '고정 선 색',
			runtime: 'forward-straight',
			controllerRestrictions: {
				controls: [
					{
						controlId: 'lineColor',
						availability: 'readonly',
					},
				],
			},
		}
		const narrowed = deriveGraphicStudioConfig(profile)

		expect(narrowed).toMatchObject({ id: 'forward-straight', name: '고정 선 색' })
		expect(deriveGraphicStudioConfig(profile)).toEqual(narrowed)
		expect(forwardStraightRuntimeManifest.name).toBe('Forward Straight')
		expect(narrowed.controller.groups[0]).toMatchObject({
			title: 'Graphic',
		})
		expect(narrowed.controllerPresentation?.groups[0]).toEqual({
			groupId: 'graphic',
			collapsible: true,
			defaultOpen: true,
		})
		expect(narrowed.controller.groups[0]?.controls[0]).toMatchObject({
			id: 'lineColor',
			label: '선 색상',
			availability: 'readonly',
			defaultValue: '#ffffff',
		})
		expect(() =>
			deriveGraphicStudioConfig({ id: 10, name: 'Unknown', runtime: 'missing' }),
		).toThrow('등록되지 않은')
	})

	it('Vector Artifact capability는 output format 정책과 독립적이다', () => {
		const values = createControllerValues(config.controller.groups)
		expect(
			getGraphicStudioVectorArtifact(config, values, {
				width: 800,
				height: 600,
			}),
		).toMatchObject({ kind: 'vector' })
	})

	it('Catalog는 같은 stable ID의 Plugin을 중복 등록하지 않는다', () => {
		const plugin = {
			manifest: config,
		}
		expect(() => createGraphicStudioPluginCatalog([plugin, plugin])).toThrow(
			'중복된 Graphic plugin',
		)
	})
})
