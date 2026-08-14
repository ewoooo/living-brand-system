import { describe, expect, it } from 'vitest'
import { getGraphicStudioVectorArtifact } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'
import forwardStraightRuntimeManifest, {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
} from './graphic-runtimes/forward-straight/definition'
import {
	forwardStraightInputSchema,
	toForwardStraightInput,
} from './graphic-runtimes/forward-straight/model'

describe('forwardStraightRuntimeManifest', () => {
	it('P5 계약의 Controller 기본값을 런타임 입력으로 복원한다', () => {
		expect(forwardStraightRuntimeManifest.type).toBe('p5')
		expect(
			toForwardStraightInput(
				createControllerValues(forwardStraightRuntimeManifest.controller.groups),
			),
		).toEqual(FORWARD_STRAIGHT_DEFAULT_INPUT)
	})

	it('런타임 입력의 범위와 알려지지 않은 필드를 거부한다', () => {
		expect(
			forwardStraightInputSchema.safeParse({
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				origin: { x: 1.1, y: 0.5 },
			}).success,
		).toBe(false)
		expect(
			forwardStraightInputSchema.safeParse({
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				extra: true,
			}).success,
		).toBe(false)
	})

	it('Controller 기본값과 viewport를 pure Vector Artifact projector에 전달한다', () => {
		const values = createControllerValues(forwardStraightRuntimeManifest.controller.groups)
		const first = getGraphicStudioVectorArtifact(forwardStraightRuntimeManifest, values, {
			width: 100,
			height: 100,
		})
		const second = getGraphicStudioVectorArtifact(forwardStraightRuntimeManifest, values, {
			width: 100,
			height: 100,
		})
		expect(second).toEqual(first)
		expect(first).toMatchObject({ kind: 'vector', source: { width: 100, height: 100 } })
	})
})
