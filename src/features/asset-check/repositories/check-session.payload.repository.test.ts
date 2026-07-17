import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { CheckSessionInputMismatchError } from '@/features/asset-check/domain/check-session'
import { getCheckSessionRecord } from './check-session.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
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
