/**
 * POC 하드코딩 기준값 (essenherb 전용).
 *
 * 원래는 BrandRule(브랜드별 RuleSpec 인스턴스)이 담을 값이지만, POC 단계에선
 * "검수가 된다"는 사실을 먼저 증명하기 위해 essenherb 한 브랜드의 color.palette
 * 기준값을 여기에 직접 박는다. 출처: brand-lint essenherb B.2 Color System
 * (Ami Cosmetic Co., Ltd.) 전사본의 Main/Multi Color 32색.
 */

export interface Swatch {
	name: string
	hex: string
}

/** color.palette RuleSpec의 paramSchema.swatches에 해당하는 essenherb 지정 컬러. */
export const ESSENHERB_SWATCHES: Swatch[] = [
	// Main Color
	{ name: 'Essenherb Red', hex: 'EA5343' },
	{ name: 'White', hex: 'FFFFFF' },
	{ name: 'Black', hex: '000000' },
	// Red family
	{ name: 'Red 1', hex: 'FFF0EB' },
	{ name: 'Red 2', hex: 'FFB4AA' },
	{ name: 'Red 4', hex: '871400' },
	{ name: 'Red 5', hex: '460500' },
	// Yellow family
	{ name: 'Yellow 1', hex: 'FFFAC2' },
	{ name: 'Yellow 2', hex: 'FFF095' },
	{ name: 'Yellow 3', hex: 'FFE65F' },
	{ name: 'Yellow 4', hex: 'A07D0F' },
	{ name: 'Yellow 5', hex: '503200' },
	// Green family
	{ name: 'Green 1', hex: 'E6FFE6' },
	{ name: 'Green 2', hex: 'A7F5AE' },
	{ name: 'Green 3', hex: '50AE5F' },
	{ name: 'Green 4', hex: '195F30' },
	{ name: 'Green 5', hex: '002B1E' },
	// Blue family
	{ name: 'Blue 1', hex: 'E1F0FF' },
	{ name: 'Blue 2', hex: 'A5CDFF' },
	{ name: 'Blue 3', hex: '3C87CD' },
	{ name: 'Blue 4', hex: '1E508C' },
	{ name: 'Blue 5', hex: '001941' },
	// Purple family
	{ name: 'Purple 1', hex: 'FAEBFF' },
	{ name: 'Purple 2', hex: 'EBC8E9' },
	{ name: 'Purple 3', hex: 'A546BE' },
	{ name: 'Purple 4', hex: '692373' },
	{ name: 'Purple 5', hex: '3C0046' },
	// Gray family
	{ name: 'Gray 1', hex: 'FAFAFA' },
	{ name: 'Gray 2', hex: 'EBEBEB' },
	{ name: 'Gray 3', hex: 'ACACAC' },
	{ name: 'Gray 4', hex: '464646' },
	{ name: 'Gray 5', hex: '151515' },
]

/** 팔레트 통과선(충족률 %). passThreshold 이상이면 통과. */
export const ESSENHERB_PASS_THRESHOLD = 90

/**
 * 한 픽셀 색이 "팔레트 안"으로 인정되는 deltaE(CIE76) 허용 오차.
 * 사람 눈에 거의 같다고 보는 범위(≈10) 기준.
 */
export const PALETTE_DELTA_E_TOLERANCE = 12
