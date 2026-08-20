import { describe, expect, it } from 'vitest'
import {
	estimateDataUrlBytes,
	fitWithin,
	MAX_IMAGE_ATTACHMENT_BYTES,
	needsImageCompression,
} from './compress-image-attachments'

describe('fitWithin', () => {
	it('긴 변을 maxEdge에 맞추고 비율을 유지한다', () => {
		expect(fitWithin(4000, 2000, 2048)).toEqual({ width: 2048, height: 1024 })
		expect(fitWithin(2000, 4000, 2048)).toEqual({ width: 1024, height: 2048 })
	})

	it('한도 안의 이미지는 확대하지 않는다', () => {
		expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 })
	})
})

describe('needsImageCompression', () => {
	it('한도를 넘는 래스터 이미지만 고른다', () => {
		const over = MAX_IMAGE_ATTACHMENT_BYTES + 1
		expect(needsImageCompression({ size: over, type: 'image/png' })).toBe(true)
		expect(needsImageCompression({ size: 1000, type: 'image/png' })).toBe(false)
		expect(needsImageCompression({ size: over, type: 'image/svg+xml' })).toBe(false)
		expect(needsImageCompression({ size: over, type: 'text/plain' })).toBe(false)
	})
})

describe('estimateDataUrlBytes', () => {
	it('base64 payload의 디코딩 크기를 어림한다', () => {
		// 'AAAA' = 3바이트
		expect(estimateDataUrlBytes('data:image/jpeg;base64,AAAA')).toBe(3)
	})
})
