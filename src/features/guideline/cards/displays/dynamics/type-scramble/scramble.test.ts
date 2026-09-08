import { describe, expect, it } from 'vitest'
import { scrambleFrame } from './view'

// 한 프레임이 지켜야 하는 것 셋. 깨지면 화면에서는 "판이 출렁인다"·"두부(□)가 뜬다"로만 보여
// 원인을 못 찾는다.
const TARGET = 'A FUTURE BUILDER'
const POOL = [...new Set(Array.from(TARGET.replace(/\s/g, '')))]

describe('scrambleFrame', () => {
	it('글자 수와 공백 자리를 보존한다', () => {
		for (const elapsed of [0, 100, 500, 2000]) {
			const frame = scrambleFrame(TARGET, POOL, elapsed)
			expect(Array.from(frame)).toHaveLength(Array.from(TARGET).length)
			// 공백이 섞이면 낱말 경계가 매 틱 흔들려 글자 수가 같아도 판형이 출렁인다.
			for (const [i, ch] of Array.from(TARGET).entries()) {
				if (ch === ' ') expect(Array.from(frame)[i]).toBe(' ')
			}
		}
	})

	it('풀에 있는 글자만 쓴다', () => {
		// 서브셋 폰트에 없는 글자를 뽑으면 두부(□)가 뜬다.
		const allowed = new Set([...POOL, ' '])
		for (const ch of scrambleFrame(TARGET, POOL, 0)) expect(allowed.has(ch)).toBe(true)
	})

	it('왼쪽부터 굳고, 다 지나면 목표 문자열이 된다', () => {
		// STAGGER_MS 70 기준: elapsed 210ms면 앞 3자가 잠긴다.
		expect(scrambleFrame(TARGET, POOL, 210).slice(0, 3)).toBe(TARGET.slice(0, 3))
		expect(scrambleFrame(TARGET, POOL, Array.from(TARGET).length * 70)).toBe(TARGET)
	})
})
