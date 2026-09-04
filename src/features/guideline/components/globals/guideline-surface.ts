import { isLightColor, isValidHex } from '@/lib/color'

/**
 * 색을 **데이터로 주입한 면**의 공용 계약. 블록(`blocks/block`)과 꼭지(`blocks/section`)가
 * 같은 면을 그리므로 여기 한 곳이 소유한다 — 두 곳에 같은 계산을 두면 톤이 조용히 갈라진다.
 *
 * 톤 어휘의 정의는 `blocks/shared/fields.ts`의 `backgroundToneField()`에 있다.
 */

/** brand-colors 관계는 populate되면 객체, 아니면 id(number)다. */
type SurfaceColor = number | { hex?: string | null } | null | undefined

export type SurfaceTone = 'solid' | 'tint' | null | undefined

/** tint의 알파. 0x1a = 26/255 ≈ 10%. */
const TINT_ALPHA = '1a'

function surfaceHex(color: SurfaceColor): string | undefined {
	return color && typeof color === 'object' && color.hex ? color.hex : undefined
}

/** 면의 배경 스타일. 색이 없으면 아무것도 칠하지 않는다(면 없음과 흰 면은 다르다). */
export function surfaceStyle(
	color: SurfaceColor,
	tone: SurfaceTone,
): { background: string } | undefined {
	const hex = surfaceHex(color)
	if (!hex) return undefined
	// 8자리 hex로 알파를 붙인다. 저장된 값이 6자리가 아니면 붙이지 않는다 — 어긋난 문자열을
	// CSS에 넘기면 색이 사라지고, 그때는 톤이 아니라 데이터가 잘못된 것이다.
	const withAlpha = tone === 'tint' && isValidHex(hex)
	return { background: withAlpha ? `${hex.startsWith('#') ? hex : `#${hex}`}${TINT_ALPHA}` : hex }
}

/**
 * 색을 데이터로 주입한 면의 **토큰 스코프**를 함께 선언한다.
 *
 * 🔴 배경 hex만 인라인으로 넣으면 프레임 variant가 배경·전경을 짝으로 갖고 있던 것을 우회한다.
 *    라이트 모드 페이지에 어두운 브랜드 색을 깔면 면만 어두워지고, 안쪽 위젯은 라이트 팔레트의
 *    near-black 컨트롤을 그대로 그려 어두운 면에 묻힌다. 반대도 같다 — 다크 모드에 흰 면을 깔면
 *    밝은 전경이 흰 면에서 사라진다. 면을 칠하는 자리에서 스코프를 뒤집어 두면 시맨틱 토큰만 쓰는
 *    위젯은 전경·테두리·muted가 전부 따라온다.
 *
 * 🔴 **tint는 스코프를 뒤집지 않는다.** 10% 면은 바탕을 거의 그대로 두므로 바깥 스코프가 이미
 *    맞다. 원색의 밝기로 판정하면 `#00AF41` 10%(거의 흰 면)가 dark로 잡혀 밝은 면에 밝은 글자가
 *    얹힌다. 합성 결과로 판정할 수도 없다 — 바탕이 라이트인지 다크인지는 서버가 모른다.
 *
 * 위젯·블록에 `dark:` 변형은 0건이라 토큰 재선언만으로 충분하다. `dark:`를 쓰기 시작하면 다크
 * 페이지 안의 밝은 섬에서는 그 변형이 여전히 걸린다는 점(`.dark *` 후손 선택자)을 같이 봐야 한다.
 */
export function surfaceScopeClass(color: SurfaceColor, tone: SurfaceTone): string | undefined {
	const hex = surfaceHex(color)
	if (!hex || tone === 'tint') return undefined
	// text-foreground를 함께 준다 — 색 클래스가 없는 면은 바깥에서 **계산된** 색을 상속하므로
	// 토큰만 다시 선언해서는 글자 색이 따라오지 않는다.
	return `${isLightColor(hex) ? 'light' : 'dark'} text-foreground`
}
