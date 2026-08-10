import { describe, expect, it } from 'vitest'
import { CAP_TRIM, composedArea, FONT, LOCKUPS } from './rules'

// 락업 비율은 눈대중으로 못 고치게 막아 둔 값이라, 틀어졌을 때 알려 줄 것이 필요하다.
// 화면으로는 1px 차이를 못 잡는다 — 스펙이 따로 적어 둔 총 영역이 유일한 검산식이다.

describe('CI 락업 조립 규칙', () => {
	it('조립한 워드마크 총 영역이 스펙이 명시한 영역과 같다', () => {
		const checked = LOCKUPS.filter((lockup) => lockup.area !== undefined)
		// 검산할 대상이 하나도 없으면 이 테스트는 아무것도 지키지 않는다.
		expect(checked.length).toBeGreaterThan(0)

		for (const lockup of checked) {
			expect(
				composedArea(lockup),
				`${lockup.label} — 줄 높이와 간격의 합이 스펙 영역과 다르다`,
			).toBeCloseTo(lockup.area as number, 10)
		}
	})

	it('cap 트림이 줄상자를 정확히 cap 높이로 줄인다', () => {
		// 1em 줄상자에서 위아래를 걷어낸 나머지가 cap이어야 간격 규정이 성립한다.
		expect(1 + CAP_TRIM.top + CAP_TRIM.bottom).toBeCloseTo(FONT.cap, 10)
	})

	it('락업 key가 겹치지 않는다', () => {
		const keys = LOCKUPS.map((lockup) => lockup.key)
		expect(new Set(keys).size).toBe(keys.length)
	})
})
