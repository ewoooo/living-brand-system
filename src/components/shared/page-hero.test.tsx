import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import radialFlutedGlassManifest, {
	RADIAL_FLUTED_GLASS_DEFAULT_INPUT,
} from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import { toRadialFlutedGlassInput } from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/model'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import { PageHero } from './page-hero'

const mount = vi.fn((_options: { values: ControllerValues }) => ({
	update: () => {},
	resize: () => {},
	getViewport: () => ({ width: 0, height: 0 }),
	artifacts: {},
	destroy: () => {},
}))

vi.mock('@/features/graphic-generation/graphic-runtimes/catalog/runtime.generated.client', () => ({
	graphicRuntimeCatalog: {
		'radial-fluted-glass': () => Promise.resolve({ type: 'shader', mount }),
	},
}))

// jsdom에는 둘 다 없다. PageHero는 모션 감소 확인과 리사이즈 관찰에 이것들을 쓴다.
vi.stubGlobal('matchMedia', () => ({ matches: false }))
vi.stubGlobal(
	'ResizeObserver',
	class {
		observe() {}
		disconnect() {}
	},
)

afterEach(() => {
	cleanup()
	mount.mockClear()
})

describe('PageHero', () => {
	it('런타임 manifest 기본값을 채워 mount한다', async () => {
		await act(async () => {
			render(<PageHero runtimeId={radialFlutedGlassManifest.id} fallbackSrc="/hero.png" />)
		})

		const values = mount.mock.lastCall?.[0].values ?? {}
		// 빈 객체를 넘기면 shader 입력 검증이 전부 undefined로 터진다.
		expect(toRadialFlutedGlassInput(values)).toEqual(RADIAL_FLUTED_GLASS_DEFAULT_INPUT)
	})
})
