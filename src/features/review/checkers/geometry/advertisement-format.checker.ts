/**
 * Checker: 광고 캔버스 규격(온라인 비율/오프라인 mm)에 맞는지 본다.
 * ruleKey는 `application.advertisement.format`, 파일명은 광고 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: Online 16:9, 3:4, 3:1, 1:1, 1:2; Offline 1440×2100 / 2400×1600 / 8600×2100 (mm).
export const advertisementFormatChecker = makeCanvasFormatChecker(
	'application.advertisement.format',
	[
		{ label: '16:9', width: 16, height: 9 },
		{ label: '3:4', width: 3, height: 4 },
		{ label: '3:1', width: 3, height: 1 },
		{ label: '1:1', width: 1, height: 1 },
		{ label: '1:2', width: 1, height: 2 },
		{ label: 'Offline 1440×2100mm', width: 1440, height: 2100 },
		{ label: 'Offline 2400×1600mm', width: 2400, height: 1600 },
		{ label: 'Offline 8600×2100mm', width: 8600, height: 2100 },
	],
)
