import { describe, expect, it } from 'vitest'
import {
	detectCheckImageMediaType,
	isSupportedCheckImageMediaType,
} from '@/features/asset-check/utils/image-format'

describe('check image formats', () => {
	it('accepts JPEG, PNG, and WebP while rejecting SVG', () => {
		expect(detectCheckImageMediaType(Uint8Array.from([0xff, 0xd8, 0xff]))).toBe('image/jpeg')
		expect(
			detectCheckImageMediaType(
				Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			),
		).toBe('image/png')
		expect(
			detectCheckImageMediaType(
				Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
			),
		).toBe('image/webp')
		expect(detectCheckImageMediaType(new TextEncoder().encode('<svg'))).toBeUndefined()
		expect(isSupportedCheckImageMediaType('image/svg+xml')).toBe(false)
	})
})
