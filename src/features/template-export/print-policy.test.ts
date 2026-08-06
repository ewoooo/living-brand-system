import { describe, expect, it } from 'vitest'
import { findPrintOutputBlocker, MAX_PRINT_PIXELS, MAX_PRINT_SIDE_PIXELS } from './print-policy'

describe('findPrintOutputBlocker', () => {
	it('PPI가 설정된 템플릿의 정수 픽셀 크기와 상한을 검증한다', () => {
		expect(findPrintOutputBlocker({ height: 100, printPpi: '300', width: 200 })).toBeNull()
		expect(findPrintOutputBlocker({ height: 100.5, printPpi: '300', width: 200 })).toContain(
			'양의 정수',
		)
		expect(
			findPrintOutputBlocker({
				height: MAX_PRINT_SIDE_PIXELS / 2,
				printPpi: '300',
				width: MAX_PRINT_SIDE_PIXELS,
			}),
		).toContain(`최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀`)
	})

	it('브라우저 캔버스가 축소하는 16,384px 초과 변은 총 픽셀과 무관하게 차단한다', () => {
		expect(findPrintOutputBlocker({ height: 3000, printPpi: '300', width: 20000 })).toContain(
			'너비·높이 각각',
		)
		expect(findPrintOutputBlocker({ height: 4096, printPpi: '300', width: 16384 })).toBeNull()
	})

	it('PPI를 설정하지 않은 기존 템플릿은 픽셀 제한을 적용하지 않는다', () => {
		expect(
			findPrintOutputBlocker({
				height: MAX_PRINT_PIXELS,
				printPpi: null,
				width: MAX_PRINT_PIXELS,
			}),
		).toBeNull()
	})
})
