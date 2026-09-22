import { getPayload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/payload-types'
import { AI_USAGE_STUDIOS } from '../ai-usage'
import { findAiUsageStudioTotals } from './ai-usage-studio-totals.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

const worker = { id: 7, email: 'w@example.com', role: 'worker' } as unknown as User
const manager = { id: 1, email: 'm@example.com', role: 'manager' } as unknown as User

describe('findAiUsageStudioTotals', () => {
	const where = vi.fn()

	function mockRows(rows: unknown[]) {
		const chain = {
			from: () => chain,
			groupBy: async () => rows,
			select: () => chain,
			where: (...args: unknown[]) => {
				where(...args)
				return chain
			},
		}
		vi.mocked(getPayload).mockResolvedValue({
			db: { drizzle: chain, tables: { ai_usage_events: {} } },
		} as never)
	}

	beforeEach(() => vi.clearAllMocks())
	afterEach(() => vi.resetAllMocks())

	// 🔴 사용자 지시의 핵심 — 쓴 기록이 하나도 없어도 목록이 비지 않는다.
	it('기록이 없어도 스튜디오 전부를 0으로 돌려준다', async () => {
		mockRows([])

		const rows = await findAiUsageStudioTotals(manager)

		expect(rows.map((row) => row.studio)).toEqual([...AI_USAGE_STUDIOS])
		expect(rows.every((row) => row.totalTokens === 0 && row.callCount === 0)).toBe(true)
	})

	it('측정된 스튜디오에만 값을 얹고 나머지는 0으로 둔다', async () => {
		mockRows([
			{
				callCount: '2',
				inputTokens: '30',
				outputTokens: '4000',
				studio: 'image',
				totalTokens: '4030',
			},
		])

		const rows = await findAiUsageStudioTotals(manager)
		const image = rows.find((row) => row.studio === 'image')
		const graph = rows.find((row) => row.studio === 'graph')

		// SUM이 문자열로 오는 것을 숫자로 바꿔야 화면이 자릿수를 찍을 수 있다.
		expect(image).toMatchObject({ callCount: 2, inputTokens: 30, totalTokens: 4030 })
		expect(graph).toMatchObject({ callCount: 0, totalTokens: 0 })
	})

	// 🔴 drizzle 직통 쿼리는 컬렉션 access를 안 탄다 — 범위 제한이 사라지면 남의 사용량이 샌다.
	it('manager가 아니면 본인 행으로 좁히는 조건을 건다', async () => {
		mockRows([])
		await findAiUsageStudioTotals(worker)
		const scoped = where.mock.calls[0]?.[0]

		vi.clearAllMocks()
		mockRows([])
		await findAiUsageStudioTotals(manager)
		const unscoped = where.mock.calls[0]?.[0]

		expect(scoped).not.toEqual(unscoped)
	})
})
