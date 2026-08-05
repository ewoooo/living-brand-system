export const PRINT_PPI_OPTIONS = [
	{ label: '대형 인쇄 (72ppi)', value: '72' },
	{ label: '일반 용지 인쇄 (150ppi)', value: '150' },
	{ label: '고급 용지 인쇄 (300ppi)', value: '300' },
] as const

export const MAX_PRINT_PIXELS = 67_108_864
export const MAX_PRINT_PNG_BYTES = 20_000_000

const MILLIMETERS_PER_INCH = 25.4
const PDF_POINTS_PER_INCH = 72

export type PrintPpi = 72 | 150 | 300
export type TemplatePrintFormat = 'pdf' | 'tiff'

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
	height?: unknown
	printPpi?: unknown
	width?: unknown
}): string | null {
	if (candidate.printPpi == null || candidate.printPpi === '') return null
	if (!parsePrintPpi(candidate.printPpi)) {
		return '인쇄 PPI는 72, 150, 300 중 하나여야 합니다.'
	}
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
	if (width * height > MAX_PRINT_PIXELS) {
		return `인쇄용 TIFF는 최대 ${MAX_PRINT_PIXELS.toLocaleString('en-US')}픽셀까지 지원합니다.`
	}
	return null
}
