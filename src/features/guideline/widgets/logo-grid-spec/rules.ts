// 자회사 CI 락업의 그리드 규격. 모든 값은 H(심볼/엠블럼 높이) 배수 —
// 출처 .scratch/hd-reference/01-specs.md §B (PDF p18 가로형A · p23 가로형B · p25 세로형).
// 🔴 여기 숫자를 눈대중으로 고치지 말 것. 정본과 어긋나면 브랜드팀과 상의해 스펙을 바꾼다.
// 🔴 react·에셋을 import하지 않는다 — Payload schema(Node)와 위젯(Next) 양쪽에서 참조된다.
//
// 🔑 문서에 없는 값은 지어내지 않는다. 세 자리가 그렇다:
//  1. 가로형B는 0.9H 영역 안에 0.4H+0.4H, 세로형은 0.7H 안에 0.3H+0.3H → 남는 0.1H의 정체가 없다.
//     라인 사이 여백으로 그리되 label을 비워 치수선·치수 목록에서 뺀다(추정치를 규정처럼 보이지 않게).
//  2. 가로형A 영문의 'HD' 글자 높이는 문서에 아예 없다 → unspec으로 표시하고 값을 제시하지 않는다.
//  3. 자회사 락업의 클리어스페이스·최소크기는 p18/23/25에 없고 CI 규정(§A) 참조뿐이라 다루지 않는다.

export type Form = 'horizontalA' | 'horizontalB' | 'vertical'
export type Lang = 'ko' | 'en'

/** 🔴 schema의 select 옵션이 이 배열을 map해 쓴다 — 키를 두 곳에 적지 않기 위함. */
export const FORM_OPTIONS = [
	{ value: 'horizontalA', label: '가로형A' },
	{ value: 'horizontalB', label: '가로형B' },
	{ value: 'vertical', label: '세로형' },
] as const satisfies readonly { value: Form; label: string }[]

export const LANG_OPTIONS = [
	{ value: 'ko', label: '국문' },
	{ value: 'en', label: '영문' },
] as const satisfies readonly { value: Lang; label: string }[]

export const NAME_KO_DEFAULT = 'HD현대중공업'
export const NAME_EN_DEFAULT = 'HYUNDAI\nHEAVY INDUSTRIES'

/** 영문 상하조합의 위 블록. 자회사명과 무관하게 그룹 공통이라 필드로 빼지 않는다. */
const HD = 'HD'

/** 심볼+폰트 조립 결과를 아트워크로 오인하지 않게 하는 안전장치. 02-copy 반복본문 ③에서 파생. */
export const FOOTNOTE =
	'그리드 규격 설명용 다이어그램입니다. 실제 사용은 승인된 HD CI 마스터 아트워크를 따릅니다.'

/** 심볼 파일. ci-lockup/rules.ts와 같은 값이지만 위젯 폴더끼리 의존시키지 않으려 되풀이한다. */
export const SYMBOL = { src: '/symbols/symbol-default.svg', aspect: 51.96 / 60 } as const

/** 로고타입 스택의 한 칸. text가 없으면 글자 없는 여백, label이 없으면 치수선을 그리지 않는다. */
export type Slot = {
	text?: string
	/** 높이 = H × 이 값 */
	h: number
	/** 구간 이름 — 치수 목록 좌열. 없으면 목록에 안 나온다 */
	name?: string
	/** 치수 값 라벨 */
	label?: string
	/** 문서에 높이 규정이 없어 표시용으로만 그린 칸 */
	unspec?: boolean
	/** 이 칸 안에 다시 쌓이는 행들. 합은 항상 이 칸의 h와 같다 */
	rows?: Slot[]
}

export type GridSpec = {
	direction: 'row' | 'column'
	/** 심볼 왼쪽 여백. 가로형A 영문에만 있다 */
	leftMargin?: Slot
	/** 심볼–로고타입 간격 */
	gap: Slot
	/** 로고타입 전체 영역 */
	block: Slot
}

/** 심볼(엠블럼) 칸 — 세 형태 모두 높이 H. */
export const SYMBOL_SLOT: Slot = { h: 1, name: '심볼 높이', label: 'H' }

/**
 * 🔴 규정이 아니다. 가로형A 영문의 'HD' 글자 높이는 문서에 없는데 다이어그램은 높이 없이 그릴 수
 * 없어서 두는 표시용 수치다. 값은 가로형A 국문 워드마크(0.65H)를 빌렸고, unspec 플래그를 달아
 * 치수선은 점선 '?'로, 치수 목록은 '문서에 명시 없음'으로 나간다.
 */
const HD_DRAW_H = 0.65

const sum = (slots: Slot[]) => slots.reduce((total, s) => total + s.h, 0)

/** 영문 하단 영역의 행들. 영역 − 행 합은 문서에 없는 잔여라 행 사이에 라벨 없이 나눈다. */
function enRows(lines: string[], rowH: number, areaH: number, label: string): Slot[] {
	const gap = lines.length > 1 ? Math.max(0, areaH - lines.length * rowH) / (lines.length - 1) : 0
	return lines.flatMap((text, i) => [
		...(i > 0 ? [{ h: gap }] : []),
		{ text, h: rowH, name: '영문 각 행 높이', label },
	])
}

/** 형태·언어 조합의 그리드 규격. 수치는 전부 이 파일 상단 주석의 출처에서만 온다. */
export function buildSpec(form: Form, lang: Lang, nameKo: string, enLines: string[]): GridSpec {
	const ko = lang === 'ko'

	if (form === 'horizontalA') {
		if (ko) {
			return {
				direction: 'row',
				gap: { h: 0.25, name: '심볼–워드마크 간격', label: '0.25H' },
				block: { text: nameKo, h: 0.65, name: '워드마크 높이', label: '0.65H' },
			}
		}
		const rows: Slot[] = [
			{ text: HD, h: HD_DRAW_H, name: 'HD 글자 영역', unspec: true },
			{ h: 0.2, name: 'HD–영문 텍스트 간격', label: '0.2H' },
			...enLines.map((text) => ({ text, h: 0.28, name: '영문 각 행 높이', label: '0.28H' })),
		]
		return {
			direction: 'row',
			leftMargin: { h: 0.65, name: '좌측 여백', label: '0.65H' },
			gap: { h: 0.25, name: '심볼–HD 간격', label: '0.25H' },
			// 영문 조합의 로고타입 전체 높이는 문서에 없다 → 행 합이 곧 영역이다(라벨 없음).
			block: { h: sum(rows), rows },
		}
	}

	if (form === 'horizontalB') {
		return {
			direction: 'row',
			gap: { h: 0.2, name: '심볼–로고타입 간격', label: '0.2H' },
			block: {
				h: 0.9,
				name: 'HD 글자 영역',
				label: '0.9H',
				rows: [
					{ text: HD, h: 0.4, name: '상단 라인(HD)', label: '0.4H' },
					{ h: 0.1 }, // 0.9 − 0.4 − 0.4. 정체가 문서에 없어 라벨을 붙이지 않는다.
					ko
						? { text: nameKo, h: 0.4, name: '하단 라인', label: '0.4H' }
						: {
								h: 0.4,
								name: '하단 라인',
								label: '0.4H',
								rows: enRows(enLines, 0.17, 0.4, '0.17H'),
							},
				],
			},
		}
	}

	return {
		direction: 'column',
		gap: { h: 0.2, name: '심볼–로고타입 간격', label: '0.2H' },
		block: {
			h: 0.7,
			name: '로고타입 영역',
			label: '0.7H',
			rows: [
				{ text: HD, h: 0.3, name: '상단 라인(HD)', label: '0.3H' },
				{ h: 0.1 }, // 0.7 − 0.3 − 0.3. 정체가 문서에 없어 라벨을 붙이지 않는다.
				ko
					? { text: nameKo, h: 0.3, name: '하단 라인', label: '0.3H' }
					: {
							h: 0.3,
							name: '하단 라인',
							label: '0.3H',
							rows: enRows(enLines, 0.125, 0.3, '0.125H'),
						},
			],
		},
	}
}

/** 다이어그램 아래 치수 목록. 라벨 없는 잔여 여백은 빠진다(문서에 없는 값을 제시하지 않는다). */
export function dimensions(spec: GridSpec): { name: string; value: string }[] {
	const out: { name: string; value: string }[] = []
	const walk = (s: Slot) => {
		if (s.name)
			out.push({ name: s.name, value: s.unspec ? '문서에 명시 없음' : (s.label ?? '') })
		s.rows?.forEach(walk)
	}
	if (spec.leftMargin) walk(spec.leftMargin)
	walk(SYMBOL_SLOT)
	walk(spec.gap)
	walk(spec.block)
	// 영문 각 행처럼 같은 이름·값이 반복되는 구간은 한 줄로 합친다.
	return out.filter(
		(d, i) => out.findIndex((o) => o.name === d.name && o.value === d.value) === i,
	)
}
