import { describe, expect, it } from 'vitest'
import { findPrintOutputBlocker, MAX_PRINT_PIXELS, MAX_PRINT_SIDE_PIXELS } from './print-policy'

describe('findPrintOutputBlocker', () => {
	it('인쇄가 활성화된 Artifact의 정수 픽셀 크기와 상한을 검증한다', () => {
		expect(findPrintOutputBlocker({ enabled: true, height: 100, width: 200 })).toBeNull()
		expect(findPrintOutputBlocker({ enabled: true, height: 100.5, width: 200 })).toContain(
			'양의 정수',
		)
		expect(
			findPrintOutputBlocker({
				enabled: true,
				height: MAX_PRINT_SIDE_PIXELS / 2,
				width: MAX_PRINT_SIDE_PIXELS,
			}),
		).toContain(`최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀`)
	})

	it('브라우저 캔버스가 축소하는 16,384px 초과 변은 총 픽셀과 무관하게 차단한다', () => {
		expect(findPrintOutputBlocker({ enabled: true, height: 3000, width: 20000 })).toContain(
			'너비·높이 각각',
		)
		expect(findPrintOutputBlocker({ enabled: true, height: 4096, width: 16384 })).toBeNull()
	})

	it('인쇄가 비활성화된 자산은 픽셀 제한을 적용하지 않는다', () => {
		expect(
			findPrintOutputBlocker({
				height: MAX_PRINT_PIXELS,
				enabled: false,
				width: MAX_PRINT_PIXELS,
			}),
		).toBeNull()
	})
})
