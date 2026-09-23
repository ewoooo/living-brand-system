import { describe, expect, it } from 'vitest'
import { AiUsageEvents } from './AiUsageEvents'

describe('AiUsageEvents collection', () => {
	it('worker에게는 자기 기록만 보이고 manager에게는 전체가 보인다', async () => {
		const read = AiUsageEvents.access?.read
		expect(typeof read).toBe('function')

		// 🔴 worker는 boolean이 아니라 Where를 받아야 한다 — true면 남의 사용량이 통째로 보인다.
		expect(await read?.({ req: { user: { id: 7, role: 'worker' } } } as never)).toEqual({
			createdBy: { equals: 7 },
		})
		expect(await read?.({ req: { user: { id: 2, role: 'manager' } } } as never)).toBe(true)
		expect(await read?.({ req: { user: { id: 1, role: 'admin' } } } as never)).toBe(true)
		expect(await read?.({ req: { user: null } } as never)).toBe(false)
	})

	it('사람이 고칠 수 없는 기록이다 — create와 update를 모두에게 닫는다', async () => {
		const create = AiUsageEvents.access?.create
		const update = AiUsageEvents.access?.update
		for (const role of ['worker', 'manager', 'admin']) {
			expect(await create?.({ req: { user: { id: 1, role } } } as never)).toBe(false)
			expect(await update?.({ req: { user: { id: 1, role } } } as never)).toBe(false)
		}
	})

	it('집계 기준이 되는 축은 인덱스와 필수를 갖는다', () => {
		for (const name of ['createdBy', 'feature', 'model']) {
			const field = AiUsageEvents.fields.find(
				(candidate) => 'name' in candidate && candidate.name === name,
			)
			expect(field, `${name} 필드가 없습니다.`).toBeDefined()
			expect(field && 'required' in field ? field.required : false).toBe(true)
			expect(field && 'index' in field ? field.index : false).toBe(true)
		}
	})
})
