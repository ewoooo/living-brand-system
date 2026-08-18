import { describe, expect, it } from 'vitest'
import {
	CLEAR_SPACE_MODES,
	type ClearSpaceMode,
	type Column,
	clearSpaceFor,
	columnArea,
	deriveLockups,
	fontSizeFor,
	type Lockup,
	lockupHeight,
	OVERSEAS_BRANCHES,
	partialColumnArea,
	STAGE_HEIGHT,
	SUBSIDIARIES,
	splitScripts,
	TIERS,
	trimFor,
} from './rules'

// 락업 비율은 눈대중으로 못 고치게 막아 둔 값이라, 틀어졌을 때 알려 줄 것이 필요하다.
// 화면으로는 1px 차이를 못 잡는다 — 스펙이 따로 적어 둔 영역 높이가 유일한 검산식이다.

/** 모든 단계 × 모든 자회사 × 모든 지부. 검산은 열거가 아니라 파생 결과 전체에 걸어야 의미가 있다. */
const ALL: Lockup[] = TIERS.flatMap((tier) =>
	SUBSIDIARIES.flatMap((subsidiary) =>
		OVERSEAS_BRANCHES.flatMap((branch) => deriveLockups({ tier, subsidiary, branch })),
	),
)

/**
 * 검산 대상 열. 두 가지를 뺀다:
 * - **구분바 열** — 행이 없다.
 * - **하단정렬 열** — 2행 그리드에 1행만 놓은 것이라 행 합이 영역보다 작은 게 맞다
 *   (해외지사 지역명이 1개일 때). 영역은 그 열이 차지하는 자리이고 행 배치는 별개다.
 */
const checkedColumns = (lockup: Lockup): Column[] =>
	lockup.columns.filter((c) => c.bar === undefined && c.align !== 'bottom')

describe('CI 락업 조립 규칙', () => {
	it('영역 높이가 명시된 락업은 모든 열이 그 높이로 닫힌다', () => {
		const checked = ALL.filter((lockup) => lockup.area !== undefined)
		// 검산할 대상이 하나도 없으면 이 테스트는 아무것도 지키지 않는다.
		expect(checked.length).toBeGreaterThan(0)

		for (const lockup of checked) {
			for (const column of checkedColumns(lockup)) {
				expect(
					columnArea(lockup, column),
					`${lockup.label} — 열(${column.rows.map((r) => r.text).join('/')})이 스펙 영역과 다르다`,
				).toBeCloseTo(lockup.area as number, 10)
			}
		}
	})

	// 🔴 해외지사 가로형B는 0.9H가 총합이 아니라 앞 3행이다. 총합에 걸면 1.12H로 어긋난다.
	it('부분 영역이 명시된 락업은 앞 몇 행까지가 그 높이로 닫힌다', () => {
		const checked = ALL.filter((lockup) => lockup.partialArea !== undefined)
		expect(checked.length).toBeGreaterThan(0)

		for (const lockup of checked) {
			const { rows, value } = lockup.partialArea as { rows: number; value: number }
			for (const column of checkedColumns(lockup)) {
				expect(
					partialColumnArea(lockup, column, rows),
					`${lockup.label} — 앞 ${rows}행 합이 부분 영역과 다르다`,
				).toBeCloseTo(value, 10)
			}
		}
	})

	// 🔴 이 위젯이 성립하는 조건 — 정본은 라틴 대문자와 한글의 위아래 끝이 같은데(0.65H로 실측)
	//    배포 폰트는 한글을 24% 크게 그린다. 스크립트별 크기·트림이 그 차이를 흡수해야 한다.
	// ⚠️ 지키는 것은 **역산식**이지 실측값이 아니다. `FONT[script].ink` 숫자가 틀려도 이 테스트는 통과한다
	//    (양쪽이 같은 값을 쓰므로). 숫자의 근거는 `.scratch/scripts/measure-cap-vs-hangul.py`뿐이다.
	it('스크립트가 달라도 그려지는 잉크 높이가 같다', () => {
		const cap = 0.65
		const h = 100
		for (const script of ['latin', 'hangul'] as const) {
			const trim = trimFor(script)
			// 줄상자(1em)에서 위아래 트림을 걷어낸 나머지가 눈에 보이는 높이다.
			expect(
				fontSizeFor(cap, h, script) * (1 + trim.top + trim.bottom),
				`${script} — 트림 후 남는 높이가 cap × H와 다르다`,
			).toBeCloseTo(cap * h, 10)
		}
	})

	it('한 줄을 스크립트가 바뀌는 자리에서 끊는다', () => {
		expect(splitScripts('HD현대')).toEqual([
			{ script: 'latin', text: 'HD' },
			{ script: 'hangul', text: '현대' },
		])
		expect(splitScripts('HD HYUNDAI')).toEqual([{ script: 'latin', text: 'HD HYUNDAI' }])
	})

	// 🔴 B.3 도판 9개가 전부 영문이다. 국문 해외지사 락업은 존재하지 않는다.
	it('해외지사에는 국문 락업이 없다', () => {
		const overseas = ALL.filter((lockup) => lockup.tier === 'overseas')
		expect(overseas.length).toBeGreaterThan(0)
		for (const lockup of overseas) {
			expect(lockup.label, `${lockup.key} — 해외지사에 국문 락업이 생겼다`).not.toContain(
				'국문',
			)
		}
	})

	// 🔴 판 높이는 고정이라(선택마다 튀지 않게) 가장 높은 락업이 그 안에 들어가야 한다.
	//    스펙 값이 바뀌어 넘치면 화면에서 잘리는데, 잘린 로고는 가이드라인으로 성립하지 않는다.
	it('모든 락업이 클리어스페이스를 켠 채로도 고정 판 높이 안에 들어간다', () => {
		expect(ALL.length).toBeGreaterThan(0)
		let worst = { height: 0, label: '', mode: '' as ClearSpaceMode }
		for (const lockup of ALL) {
			for (const mode of CLEAR_SPACE_MODES) {
				const height = lockupHeight(lockup, clearSpaceFor(lockup.orientation, mode))
				if (height > worst.height) worst = { height, label: lockup.label, mode }
			}
		}
		expect(
			worst.height,
			`${worst.label}(여백 ${worst.mode})이 판 높이 ${STAGE_HEIGHT}H를 넘는다`,
		).toBeLessThanOrEqual(STAGE_HEIGHT)
	})

	// 🔴 정본 실측값이다(`clearSpaceFor` 주석). 눈대중으로 고치면 규정 여백이 틀어진다.
	it('여백 비율이 정본 실측값과 같다', () => {
		expect(clearSpaceFor('horizontal', 'normal')).toBe(0.5)
		expect(clearSpaceFor('vertical', 'normal')).toBe(0.4)
		expect(clearSpaceFor('horizontal', 'exception')).toBe(0.25)
		expect(clearSpaceFor('vertical', 'exception')).toBe(0.2)
		expect(clearSpaceFor('horizontal', 'off')).toBe(0)
	})

	it('락업 key가 겹치지 않는다', () => {
		for (const tier of TIERS) {
			const keys = deriveLockups({
				tier,
				subsidiary: SUBSIDIARIES[0],
				branch: OVERSEAS_BRANCHES[0],
			}).map((lockup) => lockup.key)
			expect(new Set(keys).size, `${tier} — key 중복`).toBe(keys.length)
		}
	})
})
