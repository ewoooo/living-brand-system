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
