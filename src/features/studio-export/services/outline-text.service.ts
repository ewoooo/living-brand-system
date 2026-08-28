import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as fontkit from 'fontkit'

/**
 * 글자를 윤곽선 path로 바꾼다. 인쇄용 벡터 내보내기가 서체 설치에 의존하지 않게 하는 단계다.
 *
 * 🔴 서버에서만 돈다 — 서체 파일이 `public/fonts`에 있고 woff2 해제를 fontkit이 여기서 끝낸다.
 *    클라이언트 번들에 fontkit을 넣지 않는다(`/api/ci-outline`이 같은 이유로 서버에 있다).
 * 🔴 아래 표의 정본은 `src/app/(frontend)/theme.css`의 `@font-face`다. 서체가 바뀌면 함께 간다 —
 *    화면은 CSS를 따르고 인쇄물은 이 표를 따르므로, 어긋나면 둘이 다른 서체로 나온다.
 */
type FontFile = { file: string; weight: number }
type FontFamily = {
	files: readonly FontFile[]
	/**
	 * 🔴 가변 서체는 굵기를 아웃라인에 **반영하지 못한다.** fontkit 2.0.4의 `getVariation`이
	 *    woff2에서 깨진 인스턴스를 돌려준다(2026-08-27 실측: `layout()`이 `tables` undefined로 던짐).
	 *    그래서 기본 굵기에서 먼 요청은 아웃라인하지 않고 호출부에 돌려보낸다 —
	 *    Bold로 쓴 글자를 Regular 두께로 인쇄하는 것이 서체 의존을 남기는 것보다 나쁘다.
	 */
	variableDefaultWeight?: number
}

const FONT_FAMILIES: Record<string, FontFamily> = {
	pretendard: {
		files: [{ file: 'pretendard/PretendardVariable.woff2', weight: 400 }],
		variableDefaultWeight: 400,
	},
	// 국문·라틴이 파일로 갈려 있다. 글자마다 글립 보유를 물어 고르므로 unicode-range는 옮기지 않는다.
	'hd otf': {
		files: [
			{ file: 'hd/HD-Light-ko.woff2', weight: 300 },
			{ file: 'hd/HD-Light-latin.woff2', weight: 300 },
			{ file: 'hd/HD-Medium-ko.woff2', weight: 500 },
			{ file: 'hd/HD-Medium-latin.woff2', weight: 500 },
			{ file: 'hd/HD-Bold-ko.woff2', weight: 700 },
			{ file: 'hd/HD-Bold-latin.woff2', weight: 700 },
		],
	},
	isamanru: { files: [{ file: 'hd/Isamanru-Medium.woff2', weight: 400 }] },
}

/** 가변 서체에서 기본 굵기로부터 이만큼 벗어나면 아웃라인하지 않는다. */
const VARIABLE_WEIGHT_TOLERANCE = 50

export type OutlineTextRun = {
	text: string
	/** CSS `font-family` 값 그대로. 목록이면 우리가 가진 첫 서체를 쓴다. */
	fontFamily: string
	fontSize: number
	fontWeight?: number
	letterSpacing?: number
}

/**
 * 🔴 못 할 때 다른 서체로 대신 그리지 않는다. 인쇄물이 조용히 다른 서체로 나가는 것보다,
 *    글자로 남겨 두고 호출부가 알게 하는 편이 낫다.
 */
export type OutlineTextResult =
	| {
			outlined: true
			/** baseline이 원점이고 y가 아래로 자라는 지역 좌표계의 path. 배치는 호출부가 한다. */
			d: string
			/** 글자 전체 폭(px). 정렬 검산에 쓴다. */
			width: number
			family: string
	  }
	| { outlined: false; reason: 'unknown-font' | 'variable-weight' }

const cache = new Map<string, Promise<fontkit.Font>>()

function loadFont(file: string): Promise<fontkit.Font> {
	const cached = cache.get(file)
	if (cached) return cached
	const loading = readFile(path.join(process.cwd(), 'public', 'fonts', file)).then((buffer) => {
		const parsed = fontkit.create(buffer)
		return 'fonts' in parsed ? parsed.fonts[0] : parsed
	})
	cache.set(file, loading)
	return loading
}

/** CSS font-family 목록에서 우리가 파일을 가진 첫 서체를 고른다. */
export function resolveFontFamily(fontFamily: string): string | null {
	for (const raw of fontFamily.split(',')) {
		const name = raw
			.trim()
			.replace(/^["']|["']$/g, '')
			.toLowerCase()
		if (FONT_FAMILIES[name]) return name
	}
	return null
}

/** 요청 굵기에 가장 가까운 파일들. 국문·라틴 짝은 둘 다 남겨 글자마다 고르게 한다. */
function candidateFiles(family: string, fontWeight: number): readonly FontFile[] {
	const { files } = FONT_FAMILIES[family]
	const weights = [...new Set(files.map((entry) => entry.weight))]
	const nearest = weights.reduce((best, weight) =>
		Math.abs(weight - fontWeight) < Math.abs(best - fontWeight) ? weight : best,
	)
	return files.filter((entry) => entry.weight === nearest)
}

export async function outlineTextRun({
	text,
	fontFamily,
	fontSize,
	fontWeight = 400,
	letterSpacing = 0,
}: OutlineTextRun): Promise<OutlineTextResult> {
	const family = resolveFontFamily(fontFamily)
	if (!family) return { outlined: false, reason: 'unknown-font' }

	const variableDefault = FONT_FAMILIES[family].variableDefaultWeight
	if (
		variableDefault !== undefined &&
		Math.abs(fontWeight - variableDefault) > VARIABLE_WEIGHT_TOLERANCE
	) {
		return { outlined: false, reason: 'variable-weight' }
	}

	const files = candidateFiles(family, fontWeight)
	const fonts = await Promise.all(files.map((entry) => loadFont(entry.file)))

	const parts: string[] = []
	let advance = 0

	for (const segment of splitByFont(text, fonts)) {
		const font = segment.font
		const scale = fontSize / font.unitsPerEm
		const laid = font.layout(segment.text)
		laid.glyphs.forEach((glyph, index) => {
			const position = laid.positions[index]
			// 글립을 자기 자리로 옮긴 뒤 한 번에 px로 줄인다. y를 뒤집는 것은 폰트 좌표계(위로 +)를
			// SVG·PDF가 쓰는 아래로 + 좌표계로 맞추는 것이다.
			// 🔴 `advance`가 이미 글립마다 letterSpacing을 누적한다 — 여기서 또 더하면 자간이
			//    두 배가 되고, `index`는 세그먼트 안 번호라 국문↔라틴 경계에서 0으로 리셋된다.
			const placed = glyph.path
				.translate(advance / scale + (position.xOffset ?? 0), position.yOffset ?? 0)
				.scale(scale, -scale)
			const d = placed.toSVG()
			if (d) parts.push(d)
			advance += position.xAdvance * scale + letterSpacing
		})
	}

	return { outlined: true, d: parts.join(' '), width: advance, family }
}

/**
 * 글자마다 글립을 가진 서체로 가른다. HD체는 국문·라틴이 파일로 갈려 있어서, 한 줄에 둘이 섞이면
 * 한 파일로는 두부(.notdef)가 난다.
 */
function splitByFont(
	text: string,
	fonts: readonly fontkit.Font[],
): { text: string; font: fontkit.Font }[] {
	const segments: { text: string; font: fontkit.Font }[] = []
	for (const character of text) {
		const codePoint = character.codePointAt(0) ?? 0
		const font =
			fonts.find((candidate) => candidate.hasGlyphForCodePoint(codePoint)) ?? fonts[0]
		const last = segments.at(-1)
		if (last && last.font === font) last.text += character
		else segments.push({ text: character, font })
	}
	return segments
}
