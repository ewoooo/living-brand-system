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
 */

export type SwatchFamily = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray' | 'extreme'

export interface Swatch {
	name: string
	hex: string
	/** 원본 표기 보존 "R G B" */
	rgb: string
	/** Pantone Coated (Gray·extreme은 미지정) */
	pantone: string | null
	family: SwatchFamily
	/** family 내 명도 스텝 1(Light)~5(Dark). extreme(White/Black)은 null */
	tone: number | null
}

/** essenherb 지정 32색. brand-colors 컬렉션으로 이관 시 이 구조가 매핑 소스가 된다. */
export const ESSENHERB_SWATCHES: Swatch[] = [
	// 극단값 (2)
	{
		name: 'White',
		hex: 'FFFFFF',
		rgb: '255 255 255',
		pantone: null,
		family: 'extreme',
		tone: null,
	},
	{ name: 'Black', hex: '000000', rgb: '0 0 0', pantone: null, family: 'extreme', tone: null },
	// Red (채도)
	{ name: 'Red 1', hex: 'FFF0EB', rgb: '255 240 235', pantone: '705C', family: 'red', tone: 1 },
	{ name: 'Red 2', hex: 'FFB4AA', rgb: '255 180 170', pantone: '169C', family: 'red', tone: 2 },
	{
		name: 'Essenherb Red',
		hex: 'EA5343',
		rgb: '234 83 67',
		pantone: 'Warm Red C',
		family: 'red',
		tone: 3,
	},
	{ name: 'Red 4', hex: '871400', rgb: '135 20 0', pantone: '7620C', family: 'red', tone: 4 },
	{ name: 'Red 5', hex: '460500', rgb: '70 5 0', pantone: '188C', family: 'red', tone: 5 },
	// Yellow (채도)
	{
		name: 'Yellow 1',
		hex: 'FFFAC2',
		rgb: '255 250 194',
		pantone: '600C',
		family: 'yellow',
		tone: 1,
	},
	{
		name: 'Yellow 2',
		hex: 'FFF095',
		rgb: '255 240 149',
		pantone: '602C',
		family: 'yellow',
		tone: 2,
	},
	{
		name: 'Yellow 3',
		hex: 'FFE65F',
		rgb: '255 230 95',
		pantone: '7404C',
		family: 'yellow',
		tone: 3,
	},
	{
		name: 'Yellow 4',
		hex: 'A07D0F',
		rgb: '160 125 15',
		pantone: '118C',
		family: 'yellow',
		tone: 4,
	},
	{
		name: 'Yellow 5',
		hex: '503200',
		rgb: '80 50 0',
		pantone: '7575C',
		family: 'yellow',
		tone: 5,
	},
	// Green (채도)
	{
		name: 'Green 1',
		hex: 'E6FFE6',
		rgb: '230 255 230',
		pantone: '2253C',
		family: 'green',
		tone: 1,
	},
	{
		name: 'Green 2',
		hex: 'A7F5AE',
		rgb: '167 245 174',
		pantone: '2255C',
		family: 'green',
		tone: 2,
	},
	{
		name: 'Green 3',
		hex: '50AE5F',
		rgb: '80 174 95',
		pantone: '2257C',
		family: 'green',
		tone: 3,
	},
	{ name: 'Green 4', hex: '195F30', rgb: '25 95 48', pantone: '555C', family: 'green', tone: 4 },
	{ name: 'Green 5', hex: '002B1E', rgb: '0 43 30', pantone: '567C', family: 'green', tone: 5 },
	// Blue (채도)
	{ name: 'Blue 1', hex: 'E1F0FF', rgb: '225 240 255', pantone: '657C', family: 'blue', tone: 1 },
	{
		name: 'Blue 2',
		hex: 'A5CDFF',
		rgb: '165 205 255',
		pantone: '2717C',
		family: 'blue',
		tone: 2,
	},
	{ name: 'Blue 3', hex: '3C87CD', rgb: '60 135 205', pantone: '279C', family: 'blue', tone: 3 },
	{ name: 'Blue 4', hex: '1E508C', rgb: '30 80 140', pantone: '2161C', family: 'blue', tone: 4 },
	{ name: 'Blue 5', hex: '001941', rgb: '0 25 65', pantone: '2768C', family: 'blue', tone: 5 },
	// Purple (채도)
	{
		name: 'Purple 1',
		hex: 'FAEBFF',
		rgb: '250 235 255',
		pantone: '531C',
		family: 'purple',
		tone: 1,
	},
	{
		name: 'Purple 2',
		hex: 'EBC8E9',
		rgb: '225 200 233',
		pantone: '529C',
		family: 'purple',
		tone: 2,
	},
	{
		name: 'Purple 3',
		hex: 'A546BE',
		rgb: '165 70 190',
		pantone: '258C',
		family: 'purple',
		tone: 3,
	},
	{
		name: 'Purple 4',
		hex: '692373',
		rgb: '105 35 115',
		pantone: '260C',
		family: 'purple',
		tone: 4,
	},
	{
		name: 'Purple 5',
		hex: '3C0046',
		rgb: '60 0 70',
		pantone: '7449C',
		family: 'purple',
		tone: 5,
	},
	// Gray (무채도)
	{ name: 'Gray 1', hex: 'FAFAFA', rgb: '250 250 250', pantone: null, family: 'gray', tone: 1 },
	{ name: 'Gray 2', hex: 'EBEBEB', rgb: '235 235 235', pantone: null, family: 'gray', tone: 2 },
	{ name: 'Gray 3', hex: 'ACACAC', rgb: '172 172 172', pantone: null, family: 'gray', tone: 3 },
	{ name: 'Gray 4', hex: '464646', rgb: '70 70 70', pantone: null, family: 'gray', tone: 4 },
	{ name: 'Gray 5', hex: '151515', rgb: '21 21 21', pantone: null, family: 'gray', tone: 5 },
]

/** 팔레트 통과선(충족률 %). checkColorPalette(테스트)용. */
export const ESSENHERB_PASS_THRESHOLD = 90

/**
 * 한 픽셀 색이 "팔레트 안"으로 인정되는 deltaE(CIE76) 허용 오차.
 * 사람 눈에 거의 같다고 보는 범위(≈10) 기준.
 */
export const PALETTE_DELTA_E_TOLERANCE = 12
