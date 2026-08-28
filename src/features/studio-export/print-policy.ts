export const PRINT_PPI_VALUES = [72, 150, 300] as const

export const PRINT_PPI_OPTIONS = [
	{ label: '대형 인쇄 (72ppi)', value: '72' },
	{ label: '일반 용지 인쇄 (150ppi)', value: '150' },
	{ label: '고급 용지 인쇄 (300ppi)', value: '300' },
] as const

export const MAX_PRINT_PIXELS = 67_108_864
// 브라우저 캔버스(html-to-image)가 16,384px 초과 변을 조용히 축소해 서버의 정확한 크기 검증이 영원히 실패한다.
export const MAX_PRINT_SIDE_PIXELS = 16_384
export const MAX_PRINT_PNG_BYTES = 20_000_000

const MILLIMETERS_PER_INCH = 25.4
const PDF_POINTS_PER_INCH = 72

/**
 * 인쇄 해상도의 유효 범위. 🔑 `PRINT_PPI_VALUES`는 드롭다운에 띄우는 **프리셋**일 뿐이고
 * 사람이 직접 입력한 값도 받으므로, 유효성은 목록이 아니라 이 범위가 정한다.
 * 하한은 품질 기준이 아니라 나눗셈이 성립하는 최소값이다.
 */
export const MIN_PRINT_PPI = 1
/** 이미지 해상도의 상한. 출력기의 장치 dpi와는 다른 개념이라 이 위로는 인쇄물에서 얻는 것이 없다. */
export const MAX_PRINT_PPI = 1200

/** 인쇄 해상도(ppi). 프리셋 밖의 값이 직접 입력으로 들어오므로 유니온이 아니다. */
export type PrintPpi = number
export type PrintExportFormat = 'pdf' | 'tiff'

export function isPrintPpi(value: unknown): value is PrintPpi {
	return (
		typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= MIN_PRINT_PPI &&
		value <= MAX_PRINT_PPI
	)
}

export function parsePrintPpi(value: unknown): PrintPpi | undefined {
	const ppi = Number(value)
	return isPrintPpi(ppi) ? ppi : undefined
}

export function pixelsToMillimeters(pixels: number, ppi: PrintPpi): number {
	return (pixels / ppi) * MILLIMETERS_PER_INCH
}

/** 물리 크기를 그 해상도로 채우는 픽셀 수. 판을 mm로 잡을 때 렌더 크기가 여기서 나온다. */
export function millimetersToPixels(millimeters: number, ppi: PrintPpi): number {
	return Math.round((millimeters / MILLIMETERS_PER_INCH) * ppi)
}

export function millimetersToPdfPoints(millimeters: number): number {
	return (millimeters / MILLIMETERS_PER_INCH) * PDF_POINTS_PER_INCH
}

/**
 * 픽셀 좌표를 PDF 페이지 단위(pt)로 옮긴다.
 * 🔴 이것 없이 px를 pt에 그대로 꽂으면 **그 판이 72ppi라고 선언하는 것**이 된다(pt = 1/72인치).
 */
export function pixelsToPdfPoints(pixels: number, ppi: PrintPpi): number {
	// 🔑 나눗셈을 뒤에 둔다 — `(1 / 300) * 72`는 0.24000000000000002가 되어 그 잡음이
	//    PDF 변환 행렬에 17자리로 그대로 박힌다. `(1 * 72) / 300`은 0.24로 떨어진다.
	return (pixels * PDF_POINTS_PER_INCH) / ppi
}

export function findPrintOutputBlocker(candidate: {
	enabled?: unknown
	height?: unknown
	width?: unknown
}): string | null {
	if (!candidate.enabled) return null
	const width = Number(candidate.width)
	const height = Number(candidate.height)
	if (
		!Number.isSafeInteger(width) ||
		width <= 0 ||
		!Number.isSafeInteger(height) ||
		height <= 0
	) {
		return '인쇄용 TIFF를 사용하려면 너비와 높이가 양의 정수여야 합니다.'
	}
	if (width > MAX_PRINT_SIDE_PIXELS || height > MAX_PRINT_SIDE_PIXELS) {
		return `인쇄용 출력은 너비·높이 각각 최대 ${MAX_PRINT_SIDE_PIXELS.toLocaleString('en-US')}px까지 지원합니다. 브라우저 캔버스가 이보다 큰 변을 축소해 인쇄 크기 검증에 실패합니다.`
	}
	if (width * height > MAX_PRINT_PIXELS) {
		return `인쇄용 TIFF는 최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀까지 지원합니다.`
	}
	return null
}
