import { describe, expect, it } from 'vitest'
import {
	buildSpec,
	dimensions,
	FORM_OPTIONS,
	LANG_OPTIONS,
	NAME_EN_DEFAULT,
	NAME_KO_DEFAULT,
	type Slot,
} from './rules'

// 영역 높이와 그 안 행들의 합이 어긋나면 다이어그램이 조용히 거짓 규격을 그린다(치수선은 맞는데
// 그림이 틀린 상태). 눈으로 안 잡히는 종류라 여기서만 잡는다.
const enLines = NAME_EN_DEFAULT.split('\n')
const sum = (slots: Slot[]) => slots.reduce((total, s) => total + s.h, 0)

function assertRowsFill(slot: Slot) {
	if (!slot.rows) return
	expect(sum(slot.rows)).toBeCloseTo(slot.h, 6)
	slot.rows.forEach(assertRowsFill)
}

describe('buildSpec', () => {
	for (const { value: form } of FORM_OPTIONS) {
		for (const { value: lang } of LANG_OPTIONS) {
			it(`${form}/${lang}: 영역 높이 = 내부 행 합`, () => {
				assertRowsFill(buildSpec(form, lang, NAME_KO_DEFAULT, enLines).block)
			})
		}
	}

	it('문서에 있는 값만 치수 목록에 나온다', () => {
		// 가로형B 국문: 0.9H 안의 잔여 0.1H는 라벨이 없어 목록에서 빠진다.
		const values = dimensions(buildSpec('horizontalB', 'ko', NAME_KO_DEFAULT, enLines)).map(
			(d) => d.value,
		)
		expect(values).toEqual(['H', '0.2H', '0.9H', '0.4H', '0.4H'])

		// 가로형A 영문의 HD 글자 높이는 문서에 없다 — 수치로 제시하지 않는다.
		const en = dimensions(buildSpec('horizontalA', 'en', NAME_KO_DEFAULT, enLines))
		expect(en.find((d) => d.name === 'HD 글자 영역')?.value).toBe('문서에 명시 없음')
	})
})
