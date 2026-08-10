import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	CheckSession,
	CheckSessionInputMismatchError,
} from '@/features/asset-check/domain/check-session'
import {
	completeRunningCheckSessionRecord,
	getCheckSessionRecord,
} from './check-session.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@payloadcms/db-postgres/drizzle', () => ({
	and: vi.fn((...conditions: unknown[]) => conditions),
	eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('getCheckSessionRecord', () => {
	it('Payload 레코드의 JSON·pending·입력 필드를 Aggregate snapshot으로 정규화한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 7,
					status: 'running',
					results: null,
					pendingCheckKeys: ['color.palette', null, 3],
					rulesetSnapshot: null,
					inputSha256: 'a'.repeat(64),
					inputMediaType: 'image/png',
					inputByteLength: 128,
					aiUsage: null,
					errorMessage: null,
					completedAt: null,
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)
		const user = { id: 9 } as never

		const session = await getCheckSessionRecord(7, user)

		expect(session).not.toBeNull()
		expect(session?.results).toEqual({})
		expect(session?.pendingCheckKeys).toEqual(['color.palette'])
		expect(() =>
			session?.assertInputMatches({
				sha256: 'a'.repeat(64),
				mediaType: 'image/png',
				byteLength: 128,
			}),
		).not.toThrow()
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					and: [{ id: { equals: 7 } }, { createdBy: { equals: 9 } }],
				},
			}),
		)
	})

	it('지원하지 않는 저장 media type은 유효한 입력 snapshot으로 복원하지 않는다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 7,
					status: 'running',
					results: {},
					pendingCheckKeys: [],
					inputSha256: 'a'.repeat(64),
					inputMediaType: 'text/plain',
					inputByteLength: 128,
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const session = await getCheckSessionRecord(7, { id: 9 } as never)

		expect(() =>
			session?.assertInputMatches({
				sha256: 'a'.repeat(64),
				mediaType: 'image/png',
				byteLength: 128,
			}),
		).toThrow(CheckSessionInputMismatchError)
	})
})

describe('completeRunningCheckSessionRecord', () => {
	it.each([
		[[{ id: 7 }], true],
		[[], false],
	])('running 조건부 update 결과를 완료 선점 여부로 반환한다', async (rows, expected) => {
		const returning = vi.fn().mockResolvedValue(rows)
		const where = vi.fn(() => ({ returning }))
		const set = vi.fn(() => ({ where }))
		const update = vi.fn(() => ({ set }))
		const table = {
			id: 'id',
			createdBy: 'createdBy',
			status: 'status',
		}
		vi.mocked(getPayload).mockResolvedValue({
			db: {
				drizzle: { update },
				tables: { check_sessions: table },
			},
		} as never)
		const session = CheckSession.restore({
			id: 7,
			status: 'completed',
			results: {},
			pendingCheckKeys: [],
			completedAt: '2026-07-31T12:00:00.000Z',
		})

		await expect(completeRunningCheckSessionRecord(session, { id: 9 } as never)).resolves.toBe(
			expected,
		)
		expect(update).toHaveBeenCalledWith(table)
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'completed',
				results: {},
				pendingCheckKeys: [],
				completedAt: '2026-07-31T12:00:00.000Z',
			}),
		)
		expect(returning).toHaveBeenCalledWith({ id: 'id' })
	})
})
