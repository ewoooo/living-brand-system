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

export type PrintPpi = (typeof PRINT_PPI_VALUES)[number]
export type PrintExportFormat = 'pdf' | 'tiff'

export function parsePrintPpi(value: unknown): PrintPpi | undefined {
	const ppi = Number(value)
	return ppi === 72 || ppi === 150 || ppi === 300 ? ppi : undefined
}

export function pixelsToMillimeters(pixels: number, ppi: PrintPpi): number {
	return (pixels / ppi) * MILLIMETERS_PER_INCH
}

export function millimetersToPdfPoints(millimeters: number): number {
	return (millimeters / MILLIMETERS_PER_INCH) * PDF_POINTS_PER_INCH
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
