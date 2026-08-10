import config from '@payload-config'
import { getPayload } from 'payload'
import type { BrandColor } from '@/payload-types'
import { AVAILABLE_WEIGHTS, SCRAMBLE_DEFAULT, WEIGHTS, type WeightKey } from '../brand-typeface'
import { TypeScrambleView } from './view'

// 위젯(서버): 인스턴스 값을 정리해 뷰에 넘긴다. 애니메이션과 크기 맞춤은 전부 뷰가 맡는다.
//
// props 타입을 손으로 적는다 — payload-types.ts는 상위가 이 위젯을 등록한 뒤에야 생성된다.
/** 판 크기·글자 크기 기본값. schema의 defaultValue와 같은 값이어야 화면과 admin이 어긋나지 않는다. */
const DEFAULT_FONT_SIZE = 48
const DEFAULT_PANEL_HEIGHT = 480

export async function TypeScrambleWidget({
	text,
	fontSize,
	panelHeight,
	color,
	background,
	weight,
}: {
	text?: string | null
	fontSize?: number | null
	panelHeight?: number | null
	color?: number | BrandColor | null
	background?: number | BrandColor | null
	weight?: WeightKey | null
} = {}) {
	// 🔴 줄바꿈을 그대로 살린다. 줄마다 다른 문자열로 쪼개지 않는다 — 표본 문구가 여러 줄에 걸친 한 세트다.
	//    갤러리는 props 없이 렌더하므로 비면 기본 표본으로 채운다.
	const target = (text ?? '').trim() || SCRAMBLE_DEFAULT

	const chosen = WEIGHTS.find((w) => w.key === weight) ?? WEIGHTS[2]

	// 페이지 조회 depth에 따라 관계가 id로만 올 수 있다 — 그때는 여기서 한 건만 채운다.
	const [hex, bgHex] = await Promise.all([resolveHex(color), resolveHex(background)])

	return (
		<TypeScrambleView
			text={target}
			color={hex}
			background={bgHex}
			fontSize={fontSize ?? DEFAULT_FONT_SIZE}
			panelHeight={panelHeight ?? DEFAULT_PANEL_HEIGHT}
			weight={chosen.value}
			// 🔴 지금 붙은 서체 파일에 없는 굵기는 브라우저가 합성한다 — 원본과 다르게 보이므로
			//    "이건 진짜 그 굵기가 아니다"를 화면에 알린다. 서체가 교체되면 저절로 사라진다.
			synthetic={!AVAILABLE_WEIGHTS.includes(chosen.value)}
			weightLabel={chosen.label}
		/>
	)
}

/** 삭제된 색을 가리키면 null — 위젯 하나가 페이지 전체를 죽이지 않게 한다. */
async function resolveHex(color?: number | BrandColor | null): Promise<string | null> {
	if (color == null) return null
	if (typeof color === 'object') return color.hex ?? null
	try {
		const payload = await getPayload({ config })
		const doc = await payload.findByID({ collection: 'brand-colors', id: color, depth: 0 })
		return doc.hex ?? null
	} catch {
		return null
	}
}

export default TypeScrambleWidget
