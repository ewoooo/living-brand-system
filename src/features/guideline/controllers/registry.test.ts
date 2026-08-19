import { describe, expect, it } from 'vitest'
import { applyControllerRestrictions } from '@/modules/studio-controller/controller-definition'
import { LAYOUT_GRID_MANIFEST } from '../widgets/layout-grid/manifest'
import { controllerEntryFor } from './registry'

const entry = controllerEntryFor('layoutGridControlsWidget')

function effective(fields: Record<string, unknown>) {
	if (!entry) throw new Error('layoutGridControlsWidget 엔트리가 없습니다')
	const groups = applyControllerRestrictions(entry.manifest.groups, entry.toRestrictions(fields))
	return new Map(
		groups.flatMap((group) => group.controls.map((control) => [control.id, control] as const)),
	)
}

describe('controllerEntryFor', () => {
	it('레지스트리에 없는 자식은 컨트롤러를 열지 않는다', () => {
		expect(controllerEntryFor('layoutGridWidget')).toBeUndefined()
		expect(controllerEntryFor('typeWeightWidget')).toBeUndefined()
	})
})

describe('admin 값 → restriction', () => {
	it('조절 불허는 readonly가 되고, 허용은 손대지 않는다', () => {
		const controls = effective({ marginAdjustable: false, gutterXAdjustable: true })

		expect(controls.get('marginPct')?.availability).toBe('readonly')
		expect(controls.get('gutterX')?.availability).toBeUndefined()
	})

	it('🔴 미설정(undefined)은 허용이다 — false와 갈라야 한다', () => {
		// Payload checkbox는 저장 전 undefined로 온다. `?? true`가 아니면 전부 잠긴다.
		const controls = effective({})

		expect(controls.get('marginPct')?.availability).toBeUndefined()
		expect(controls.get('guidesOn')?.availability).toBeUndefined()
	})

	it('admin 값이 매니페스트 기본값을 덮고, 없으면 그대로 둔다', () => {
		const controls = effective({ marginPct: 5.5, guidesOn: false })

		expect(controls.get('marginPct')?.defaultValue).toBe(5.5)
		expect(controls.get('guidesOn')?.defaultValue).toBe(false)
		// 안 건드린 컨트롤은 매니페스트 값 그대로.
		expect(controls.get('gutterX')?.defaultValue).toBe(75)
	})

	it('정본 범위 밖 값은 계약이 막는다 — admin이 규정을 넓힐 수 없다', () => {
		// 마진 정본은 3~6%다. 그 밖을 심으면 applyControllerRestrictions가 던진다.
		expect(() => effective({ marginPct: 99 })).toThrow()
	})
})

describe('매니페스트', () => {
	it('그룹 경계가 알약의 구분선이다 — 마진 ┃ 거터 둘 ┃ 표시', () => {
		expect(LAYOUT_GRID_MANIFEST.groups.map((group) => group.controls.length)).toEqual([1, 2, 1])
	})
})

/* ── CI 락업: 축마다 초기값 + 노출 여부 ─────────────────────────── */

const ciEntry = controllerEntryFor('ciLockupWidget')

function ciEffective(fields: Record<string, unknown>) {
	if (!ciEntry) throw new Error('ciLockupWidget 엔트리가 없습니다')
	const groups = applyControllerRestrictions(
		ciEntry.manifest.groups,
		ciEntry.toRestrictions(fields),
	)
	return new Map(
		groups.flatMap((group) => group.controls.map((control) => [control.id, control] as const)),
	)
}

describe('CI 락업 admin 값 → restriction', () => {
	it('숫자 초기값(H)이 살아남는다', () => {
		// 🔴 회귀 방어: `defaultValue` 가드에서 number를 빼면 이 값이 조용히 버려진다.
		expect(ciEffective({ h: 80 }).get('h')?.defaultValue).toBe(80)
	})

	it('hiddenControls에 담은 축만 readonly가 된다', () => {
		const controls = ciEffective({ hiddenControls: ['form', 'language'] })

		expect(controls.get('form')?.availability).toBe('readonly')
		expect(controls.get('language')?.availability).toBe('readonly')
		expect(controls.get('h')?.availability).toBeUndefined()
		expect(controls.get('clearSpace')?.availability).toBeUndefined()
	})

	it('🔴 options에 없는 select 값은 버린다 — 렌더 중 throw로 페이지가 죽지 않게', () => {
		// 계열사 목록이 바뀌면 저장된 값이 고아가 된다. 그때 던지는 대신 기본값으로 그려야 한다.
		expect(() => ciEffective({ subsidiary: '없어진회사' })).not.toThrow()
		expect(ciEffective({ subsidiary: '없어진회사' }).get('subsidiary')?.defaultValue).toBe(
			ciEntry?.manifest.groups
				.flatMap((group) => group.controls)
				.find((control) => control.id === 'subsidiary')?.defaultValue,
		)
	})

	it('정상 select 값은 초기값을 덮는다', () => {
		expect(ciEffective({ colorType: 'mono' }).get('colorType')?.defaultValue).toBe('mono')
	})
})
