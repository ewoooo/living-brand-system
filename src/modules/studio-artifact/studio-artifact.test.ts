import { describe, expect, it } from 'vitest'
import { getStudioArtifactKinds, parseStudioArtifactCapabilities } from './studio-artifact'

describe('StudioArtifactCapabilities', () => {
	it('Runtime Artifact 사양을 멱등 검증한다', () => {
		const capabilities = {
			raster: {},
			video: {
				fps: [24, 30] as const,
				maxWidth: 1920,
				maxHeight: 1080,
				maxDurationSeconds: 10,
			},
		}
		expect(parseStudioArtifactCapabilities(capabilities)).toBe(capabilities)
		expect(getStudioArtifactKinds(capabilities)).toEqual(['raster', 'video'])
	})

	it('알 수 없는 Artifact와 잘못된 영상 사양을 거부한다', () => {
		expect(() => parseStudioArtifactCapabilities({ document: {} })).toThrow('종류')
		expect(() =>
			parseStudioArtifactCapabilities({
				video: { fps: [120], maxWidth: 1920, maxHeight: 1080, maxDurationSeconds: 10 },
			}),
		).toThrow('fps')
	})
})
