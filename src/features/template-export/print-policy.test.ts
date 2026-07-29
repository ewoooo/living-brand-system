import { describe, expect, it } from 'vitest'
import { findPrintOutputBlocker, MAX_PRINT_PIXELS } from './print-policy'

describe('findPrintOutputBlocker', () => {
	it('PPI가 설정된 템플릿의 정수 픽셀 크기와 상한을 검증한다', () => {
		expect(findPrintOutputBlocker({ height: 100, printPpi: '300', width: 200 })).toBeNull()
		expect(findPrintOutputBlocker({ height: 100.5, printPpi: '300', width: 200 })).toContain(
			'양의 정수',
		)
		expect(
			findPrintOutputBlocker({
				height: 1,
				printPpi: '300',
				width: MAX_PRINT_PIXELS + 1,
			}),
		).toContain('최대')
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
