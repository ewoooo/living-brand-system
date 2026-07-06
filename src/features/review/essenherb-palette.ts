/**
 * POC 하드코딩 기준값 (essenherb 전용).
 *
 * essenherb 32색 팔레트. 구조: (채도 5계열 + 무채도 1계열) × 5톤 + 극단값 2 = (5+1)×5 + 2 = 32.
 * - 채도(chromatic): Red / Yellow / Green / Blue / Purple — 각 tone 1(Light)~5(Dark)
 * - 무채도(achromatic): Gray — tone 1~5
 * - 극단값(extreme): White / Black — tone 없음
 * Essenherb Red(EA5343)는 별도 "메인"이 아니라 Red family의 tone 3이다 (원본 p24: Red3 = Essenherb Red 동일 코드).
 *
 * 출처: Essenherb Brand Identity Guidelines B.2 Color System (p24) verbatim.
 * ※ 원래 brand-colors 컬렉션이 소유할 값 — POC라 여기 하드코딩(기술부채, brand-assets-hardcode-deferred).
 * Purple 2는 원본에서 RGB(225 200 233)와 HEX(EBC8E9)가 불일치(원본 오타) — checker가 쓰는 HEX 기준으로 둔다.
 * RGB/Pantone 원본 표기 전체는 migrations/20260706_013000_seed_baseline_data.ts에 있다.
 */

export type SwatchFamily = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray' | 'extreme'

export interface Swatch {
	name: string
	hex: string
	family: SwatchFamily
}

/** essenherb 지정 32색. brand-colors 컬렉션으로 이관 시 이 구조가 매핑 소스가 된다. */
export const ESSENHERB_SWATCHES: Swatch[] = [
	// 극단값 (2)
	{ name: 'White', hex: 'FFFFFF', family: 'extreme' },
	{ name: 'Black', hex: '000000', family: 'extreme' },
	// Red (채도)
	{ name: 'Red 1', hex: 'FFF0EB', family: 'red' },
	{ name: 'Red 2', hex: 'FFB4AA', family: 'red' },
	{ name: 'Essenherb Red', hex: 'EA5343', family: 'red' },
	{ name: 'Red 4', hex: '871400', family: 'red' },
	{ name: 'Red 5', hex: '460500', family: 'red' },
	// Yellow (채도)
	{ name: 'Yellow 1', hex: 'FFFAC2', family: 'yellow' },
	{ name: 'Yellow 2', hex: 'FFF095', family: 'yellow' },
	{ name: 'Yellow 3', hex: 'FFE65F', family: 'yellow' },
	{ name: 'Yellow 4', hex: 'A07D0F', family: 'yellow' },
	{ name: 'Yellow 5', hex: '503200', family: 'yellow' },
	// Green (채도)
	{ name: 'Green 1', hex: 'E6FFE6', family: 'green' },
	{ name: 'Green 2', hex: 'A7F5AE', family: 'green' },
	{ name: 'Green 3', hex: '50AE5F', family: 'green' },
	{ name: 'Green 4', hex: '195F30', family: 'green' },
	{ name: 'Green 5', hex: '002B1E', family: 'green' },
	// Blue (채도)
	{ name: 'Blue 1', hex: 'E1F0FF', family: 'blue' },
	{ name: 'Blue 2', hex: 'A5CDFF', family: 'blue' },
	{ name: 'Blue 3', hex: '3C87CD', family: 'blue' },
	{ name: 'Blue 4', hex: '1E508C', family: 'blue' },
	{ name: 'Blue 5', hex: '001941', family: 'blue' },
	// Purple (채도)
	{ name: 'Purple 1', hex: 'FAEBFF', family: 'purple' },
	{ name: 'Purple 2', hex: 'EBC8E9', family: 'purple' },
	{ name: 'Purple 3', hex: 'A546BE', family: 'purple' },
	{ name: 'Purple 4', hex: '692373', family: 'purple' },
	{ name: 'Purple 5', hex: '3C0046', family: 'purple' },
	// Gray (무채도)
	{ name: 'Gray 1', hex: 'FAFAFA', family: 'gray' },
	{ name: 'Gray 2', hex: 'EBEBEB', family: 'gray' },
	{ name: 'Gray 3', hex: 'ACACAC', family: 'gray' },
	{ name: 'Gray 4', hex: '464646', family: 'gray' },
	{ name: 'Gray 5', hex: '151515', family: 'gray' },
]

/**
 * 한 픽셀 색이 "팔레트 안"으로 인정되는 deltaE(CIE76) 허용 오차.
 * 사람 눈에 거의 같다고 보는 범위(≈10) 기준.
 */
export const PALETTE_DELTA_E_TOLERANCE = 12
