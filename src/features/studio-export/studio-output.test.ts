import { describe, expect, it } from 'vitest'
import { STUDIO_OUTPUT_FORMATS } from './export-contract'
import {
	parseStudioOutputCapability,
	resolveStudioArtifactOutputFormats,
	resolveStudioOutputFormats,
	supportsStudioExportRequest,
} from './studio-output'

describe('resolveStudioOutputFormats', () => {
	it('Artifact를 Exporter 호환 형식으로 투영한 뒤 Admin 제한을 적용한다', () => {
		expect(resolveStudioArtifactOutputFormats(['raster', 'vector'], ['png', 'svg'])).toEqual([
			'png',
			'svg',
		])
		expect(resolveStudioArtifactOutputFormats(['raster'], undefined)).toEqual(['png', 'jpeg'])
		expect(resolveStudioArtifactOutputFormats(['raster'], undefined, ['print'])).toEqual([
			'png',
			'jpeg',
			'tiff',
			'pdf',
		])
		expect(() => resolveStudioArtifactOutputFormats(['raster'], ['svg'])).toThrow(
			'지원하지 않는 output format',
		)
		expect(() => resolveStudioArtifactOutputFormats(['raster'], ['tiff'])).toThrow(
			'지원하지 않는 output format',
		)
	})

	it('Admin 제한이 없으면 Runtime 순서를 유지한다', () => {
		expect(resolveStudioOutputFormats(['svg', 'png'] as const, undefined)).toEqual([
			'svg',
			'png',
		])
	})

	it('Admin이 허용한 부분집합만 Runtime 순서로 남긴다', () => {
		expect(resolveStudioOutputFormats(['svg', 'png'] as const, ['png'])).toEqual(['png'])
		expect(resolveStudioOutputFormats(['svg'] as const, [])).toEqual([])
	})

	it('지원하지 않는 형식과 중복을 거부한다', () => {
		expect(() => resolveStudioOutputFormats(['svg'] as const, ['png'])).toThrow(
			'지원하지 않는 output format',
		)
		expect(() => resolveStudioOutputFormats(['svg'] as const, ['svg', 'svg'])).toThrow('중복')
		expect(() => resolveStudioOutputFormats(['svg'] as const, ['original'])).toThrow(
			'지원하지 않는 output format',
		)
	})
})

describe('StudioOutputCapability', () => {
	const capability = {
		formats: ['mp4'] as const,
		video: {
			mp4: {
				codec: 'h264' as const,
				colorSpace: 'rec709' as const,
				fps: [24, 30] as const,
				maxWidth: 1920,
				maxHeight: 1080,
				maxDurationSeconds: 10,
			},
		},
	}

	it('직렬화 가능한 MP4 범위와 요청을 검증한다', () => {
		expect(parseStudioOutputCapability(capability)).toBe(capability)
		expect(
			supportsStudioExportRequest(capability, {
				artifact: 'video',
				format: 'mp4',
				options: {
					container: 'mp4',
					codec: 'h264',
					durationSeconds: 5,
					fps: 30,
					width: 1920,
					height: 1080,
					colorSpace: 'rec709',
				},
			}),
		).toBe(true)
	})

	it('상한을 넘거나 양수가 아닌 영상 요청을 거부한다', () => {
		const request = {
			artifact: 'video' as const,
			format: 'mp4' as const,
			options: {
				container: 'mp4' as const,
				codec: 'h264' as const,
				durationSeconds: 11,
				fps: 30 as const,
				width: 0,
				height: 1080,
				colorSpace: 'rec709' as const,
			},
		}
		expect(supportsStudioExportRequest(capability, request)).toBe(false)
	})

	it('original은 format 목록이 아닌 별도 capability로 검증한다', () => {
		const request = { artifact: 'original' as const, options: {} }
		expect(supportsStudioExportRequest({ formats: [], original: true }, request)).toBe(true)
		expect(supportsStudioExportRequest({ formats: [] }, request)).toBe(false)
	})

	it('공통 정본 외 format은 parser에서 거부한다', () => {
		expect(STUDIO_OUTPUT_FORMATS).toEqual(['png', 'jpeg', 'tiff', 'pdf', 'svg', 'mp4'])
		expect(() => parseStudioOutputCapability({ formats: ['original'] })).toThrow(
			'지원하지 않는 output format',
		)
		expect(() => parseStudioOutputCapability({ formats: ['webp'] })).toThrow(
			'지원하지 않는 output format',
		)
	})
})
