import { hexToRgb, isLightColor, isValidHex } from '@/lib/color'

// ColorPalette의 최소 단위: 색 하나. 부모 Row에서 flex-1로 균등 폭을 받는다(width=fill).
export type ColorCell = {
	/** 색상 이름 — 셀 상단에 굵게 표시. */
	name: string
	/** 배경색이자 표시할 HEX 코드(예: '#1A1A1A'). 밝기에 따라 글자색 자동 대비. */
	hex: string
	/** 팬톤(PMS) 번호(선택). 주면 'PMS …' 줄이 추가된다. */
	pantone?: string
}

/**
 * 색 견본 한 칸(원자) — 배경을 hex로 칠하고 이름·HEX·RGB·PMS를 얹는다. 글자색은 밝기로 자동 대비.
 * 보통 직접 쓰지 않고 ColorPalette / Row가 여러 개를 묶어 균등 폭으로 배치한다.
 *
 * @example 단일 견본 드롭인
 * <ColorPaletteCell color={{ name: 'Primary', hex: '#1A1A1A', pantone: 'Black C' }} />
 *
 * @example 가로로 넓은 배너형 견본
 * <ColorPaletteCell color={{ name: 'Accent', hex: '#0055FF' }} aspectRatio={3} />
 */
export function ColorPaletteCell({
	color,
	aspectRatio = 1,
}: {
	/** 표시할 색 하나 — 이름·HEX·(선택)PMS. */
	color: ColorCell
	/** 셀의 가로세로 비(기본 1=정사각). 값이 클수록 납작한 가로 배너. */
	aspectRatio?: number
}) {
	return (
		<div
			className="type-caption-1 flex flex-1 flex-col rounded-sm p-4"
			style={{
				aspectRatio,
				backgroundColor: color.hex,
				color: isLightColor(color.hex) ? '#000000' : '#FFFFFF',
			}}
		>
			<span className="type-caption-1-emphasized">{color.name}</span>
			<span>HEX {color.hex}</span>
			{rgbLabel(color.hex) && <span>RGB {rgbLabel(color.hex)}</span>}
			{color.pantone && <span>PMS {color.pantone}</span>}
		</div>
	)
}

function rgbLabel(hex: string) {
	if (!isValidHex(hex)) return null
	const { r, g, b } = hexToRgb(hex)
	return `${r}/${g}/${b}`
}
