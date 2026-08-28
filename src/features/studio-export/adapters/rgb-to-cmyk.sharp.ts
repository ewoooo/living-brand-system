import sharp from 'sharp'

/** PDF가 쓰는 0~1 CMYK 성분. */
export type CmykColor = { c: number; m: number; y: number; k: number }

/**
 * 색 몇 개를 ICC 프로파일로 CMYK 변환한다. 벡터 인쇄물의 도형 색이 래스터 경로와 같은 변환을
 * 타게 하려는 것이다 — 공식으로 근사하면 같은 판의 이미지와 도형이 다른 색으로 찍힌다.
 *
 * 🔑 색마다 sharp를 부르지 않고 **1픽셀씩 늘어놓은 가로 한 줄**을 한 번에 변환한다.
 */
export async function convertRgbToCmyk(
	hexColors: readonly string[],
	icc: string,
): Promise<Map<string, CmykColor>> {
	const unique = [...new Set(hexColors)].filter((hex) => /^#[0-9a-f]{6}$/i.test(hex))
	if (unique.length === 0) return new Map()

	const rgb = Buffer.alloc(unique.length * 3)
	unique.forEach((hex, index) => {
		const value = Number.parseInt(hex.slice(1), 16)
		rgb[index * 3] = (value >> 16) & 255
		rgb[index * 3 + 1] = (value >> 8) & 255
		rgb[index * 3 + 2] = value & 255
	})

	const converted = await sharp(rgb, {
		raw: { channels: 3, height: 1, width: unique.length },
	})
		.toColourspace('cmyk')
		.withIccProfile(icc)
		.raw()
		.toBuffer()

	return new Map(
		unique.map((hex, index) => [
			hex.toLowerCase(),
			{
				// 🔴 raw CMYK는 잉크량 그대로다(0 = 잉크 없음). JPEG로 나갈 때의 Adobe 반전 관례와
				//    다르므로 뒤집지 않는다 — 2026-08-27 실측: 흰색이 0,0,0,0으로 나온다.
				c: converted[index * 4] / 255,
				m: converted[index * 4 + 1] / 255,
				y: converted[index * 4 + 2] / 255,
				k: converted[index * 4 + 3] / 255,
			},
		]),
	)
}
