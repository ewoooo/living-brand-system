import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	CheckSession,
	CheckSessionInputMismatchError,
	CheckSessionNotFoundError,
} from '@/features/asset-check/domain/check-session'
import {
	createCheckSessionRecord,
	getCheckSessionRecord,
	saveCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import { getRuntimeChecks } from '@/features/asset-check/services/get-check-ruleset.service'
import {
	runHeuristicCheck,
	runImmediateCheck,
} from '@/features/asset-check/services/run-check.service'
import type { CheckSession as CheckSessionRecord, User } from '@/payload-types'
import { completeCheckSessionAiCheck, startCheckSession } from './start-check-session.service'

vi.mock('@/features/asset-check/repositories/check-session.payload.repository', () => ({
	createCheckSessionRecord: vi.fn(),
	getCheckSessionRecord: vi.fn(),
	saveCheckSessionRecord: vi.fn(),
}))
vi.mock('@/features/asset-check/services/get-check-ruleset.service', () => ({
	getRuntimeChecks: vi.fn(),
}))
vi.mock('@/features/asset-check/services/run-check.service', () => ({
	runHeuristicCheck: vi.fn(),
	runImmediateCheck: vi.fn(),
}))

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const otherPng = Buffer.concat([png, Buffer.from([0x00])])
const user = { id: 7 } as User
const scenario = { key: 'quick', title: '빠른 검수', checkKeys: [] }

function record(
	buffer: Buffer | null,
	status: CheckSessionRecord['status'] = 'running',
): CheckSessionRecord {
	return {
		id: 41,
		source: 'review-page',
		status,
		targetType: 'uploaded-image',
		pendingCheckKeys: ['heuristic'],
		...(buffer
			? {
					inputSha256: createHash('sha256').update(buffer).digest('hex'),
					inputMediaType: 'image/png' as const,
					inputByteLength: buffer.byteLength,
				}
			: {}),
		createdAt: '2026-07-17T00:00:00.000Z',
		updatedAt: '2026-07-17T00:00:00.000Z',
	}
}

describe('check session service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(getRuntimeChecks).mockResolvedValue([])
		vi.mocked(runImmediateCheck).mockResolvedValue({ results: {}, pendingCheckKeys: [] })
		vi.mocked(runHeuristicCheck).mockResolvedValue({ results: {} })
		vi.mocked(createCheckSessionRecord).mockImplementation(async () =>
			CheckSession.fromRecord(record(png, 'running') satisfies CheckSessionRecord),
		)
	})

	it('세션 시작 시 실제 바이트의 SHA-256·형식·크기를 저장한다', async () => {
		await startCheckSession({
			buffer: png,
			deferHeuristic: true,
			scenario,
			source: 'review-page',
			user,
		})

		expect(createCheckSessionRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				inputSnapshot: {
					sha256: createHash('sha256').update(png).digest('hex'),
					mediaType: 'image/png',
					byteLength: png.byteLength,
				},
			}),
		)
	})

	it('소유자 조회에서 찾지 못한 세션은 not found로 종료한다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(null)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toThrow(CheckSessionNotFoundError)
		expect(runHeuristicCheck).not.toHaveBeenCalled()
	})

	it('완료된 세션도 다른 입력이면 저장 결과보다 먼저 거부한다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.fromRecord(record(png, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: otherPng, checkSessionId: 41, user }),
		).rejects.toThrow(CheckSessionInputMismatchError)
		expect(runHeuristicCheck).not.toHaveBeenCalled()
		expect(saveCheckSessionRecord).not.toHaveBeenCalled()
	})

	it('입력 지문이 없는 과거 세션은 멱등 완료로 오인하지 않는다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.fromRecord(record(null, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toThrow(CheckSessionInputMismatchError)
	})

	it('같은 입력의 완료 세션만 저장된 결과를 멱등 반환한다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.fromRecord(record(png, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).resolves.toEqual({ checkSessionId: 41, results: {} })
		expect(runHeuristicCheck).not.toHaveBeenCalled()
	})
})
