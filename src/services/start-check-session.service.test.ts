import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	CheckSession,
	CheckSessionInputMismatchError,
	CheckSessionNotFoundError,
	type CheckSessionSnapshot,
} from '@/features/asset-check/domain/check-session'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
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
import type { User } from '@/payload-types'
import {
	completeCheckSessionAiCheck,
	completeCheckSessionObservations,
	startCheckSession,
} from './start-check-session.service'

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
const heuristicCheck: RuntimeCheck = {
	key: 'heuristic',
	title: 'Logo present',
	checker: { key: 'ai-check', type: 'heuristic' },
	executor: 'heuristic',
	heuristicCriteria: [
		{
			id: 'logo-visible',
			question: 'Is the logo visible?',
			expected: 'present',
		},
	],
	implemented: true,
	evidence: '',
	referenceAssets: [],
}

function snapshot(
	buffer: Buffer | null,
	status: CheckSessionSnapshot['status'] = 'running',
): CheckSessionSnapshot {
	return {
		id: 41,
		status,
		results: {},
		pendingCheckKeys: ['heuristic'],
		...(buffer
			? {
					inputSnapshot: {
						sha256: createHash('sha256').update(buffer).digest('hex'),
						mediaType: 'image/png' as const,
						byteLength: buffer.byteLength,
					},
				}
			: {}),
	}
}

describe('check session service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(getRuntimeChecks).mockResolvedValue([])
		vi.mocked(runImmediateCheck).mockResolvedValue({ results: {}, pendingCheckKeys: [] })
		vi.mocked(runHeuristicCheck).mockResolvedValue({ results: {} })
		vi.mocked(createCheckSessionRecord).mockImplementation(async () =>
			CheckSession.restore(snapshot(png, 'running')),
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

	it('시작 검수의 완료 상태 저장이 실패하면 DB의 running 세션을 failed로 종결한다', async () => {
		const saveError = new Error('Completed update failed.')
		const persistedSession = CheckSession.restore(snapshot(png, 'running'))
		vi.mocked(getCheckSessionRecord).mockResolvedValueOnce(persistedSession)
		vi.mocked(saveCheckSessionRecord)
			.mockRejectedValueOnce(saveError)
			.mockResolvedValueOnce(undefined)

		await expect(
			startCheckSession({
				buffer: png,
				scenario,
				source: 'review-page',
				user,
			}),
		).rejects.toBe(saveError)
		expect(persistedSession.status).toBe('failed')
		expect(saveCheckSessionRecord).toHaveBeenNthCalledWith(2, persistedSession, user)
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
			CheckSession.restore(snapshot(png, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: otherPng, checkSessionId: 41, user }),
		).rejects.toThrow(CheckSessionInputMismatchError)
		expect(runHeuristicCheck).not.toHaveBeenCalled()
		expect(saveCheckSessionRecord).not.toHaveBeenCalled()
	})

	it('입력 지문이 없는 과거 세션은 멱등 완료로 오인하지 않는다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.restore(snapshot(null, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toThrow(CheckSessionInputMismatchError)
	})

	it('같은 입력의 완료 세션만 저장된 결과를 멱등 반환한다', async () => {
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.restore(snapshot(png, 'completed')),
		)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).resolves.toEqual({ checkSessionId: 41, results: {} })
		expect(runHeuristicCheck).not.toHaveBeenCalled()
	})

	it('MCP 클라이언트 관측값은 서버 evaluator로 판정해 완료한다', async () => {
		const session = CheckSession.restore({
			...snapshot(png),
			rulesetSnapshot: [heuristicCheck],
		})
		vi.mocked(getCheckSessionRecord).mockResolvedValue(session)

		await expect(
			completeCheckSessionObservations({
				checkSessionId: 41,
				observations: {
					heuristic: {
						'logo-visible': {
							value: 'present',
							confidence: 95,
							reason: '로고가 보입니다.',
						},
					},
				},
				user,
			}),
		).resolves.toMatchObject({
			checkSessionId: 41,
			results: {
				heuristic: {
					checker: { key: 'mcp-client', type: 'ai' },
					rawResult: { status: 'pass', fulfillment: 100 },
				},
			},
		})
		expect(session.status).toBe('completed')
		expect(runHeuristicCheck).not.toHaveBeenCalled()
		expect(saveCheckSessionRecord).toHaveBeenCalledWith(session, user)
	})

	it('저장된 룰셋과 다른 MCP 관측 키는 판정·저장하지 않는다', async () => {
		const session = CheckSession.restore({
			...snapshot(png),
			rulesetSnapshot: [heuristicCheck],
		})
		vi.mocked(getCheckSessionRecord).mockResolvedValue(session)

		await expect(
			completeCheckSessionObservations({
				checkSessionId: 41,
				observations: {
					heuristic: {
						'unexpected-criterion': {
							value: 'present',
							confidence: 95,
							reason: '로고가 보입니다.',
						},
					},
				},
				user,
			}),
		).rejects.toThrow('Client check submission keys do not match')
		await expect(
			completeCheckSessionObservations({
				checkSessionId: 41,
				observations: {
					heuristic: {
						'logo-visible': {
							value: 1,
							confidence: 95,
							reason: '잘못된 관측 형식입니다.',
						},
					},
				},
				user,
			}),
		).rejects.toThrow('Client check observation does not match criterion logo-visible')
		expect(session.status).toBe('running')
		expect(saveCheckSessionRecord).not.toHaveBeenCalled()
	})

	it('AI 판정 실패를 failed로 저장하고 원 오류를 다시 던진다', async () => {
		const error = new Error('Provider failed.')
		const session = CheckSession.restore(snapshot(png, 'running'))
		vi.mocked(getCheckSessionRecord).mockResolvedValue(session)
		vi.mocked(runHeuristicCheck).mockRejectedValue(error)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toBe(error)
		expect(session.status).toBe('failed')
		expect(saveCheckSessionRecord).toHaveBeenCalledWith(session, user)
		expect(session.toUpdateData()).toEqual(
			expect.objectContaining({ status: 'failed', errorMessage: 'Provider failed.' }),
		)
	})

	it('실패 상태 저장까지 실패하면 저장 오류를 원 오류의 cause로 남긴다', async () => {
		const error = new Error('Provider failed.')
		const saveError = new Error('Database failed.')
		vi.mocked(getCheckSessionRecord).mockResolvedValue(
			CheckSession.restore(snapshot(png, 'running')),
		)
		vi.mocked(runHeuristicCheck).mockRejectedValue(error)
		vi.mocked(saveCheckSessionRecord).mockRejectedValue(saveError)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toBe(error)
		expect(error.cause).toBe(saveError)
	})

	it('완료 상태 저장이 실패하면 DB의 running 세션을 다시 읽어 failed로 종결한다', async () => {
		const saveError = new Error('Completed update failed.')
		const inMemorySession = CheckSession.restore(snapshot(png, 'running'))
		const persistedSession = CheckSession.restore(snapshot(png, 'running'))
		vi.mocked(getCheckSessionRecord)
			.mockResolvedValueOnce(inMemorySession)
			.mockResolvedValueOnce(persistedSession)
		vi.mocked(runHeuristicCheck).mockResolvedValue({
			results: {
				heuristic: {
					rule: { key: 'heuristic', title: 'Heuristic', executor: 'heuristic' },
					checker: { key: 'ai-check', type: 'ai' },
					rawResult: { status: 'pass', fulfillment: 100 },
				},
			},
		})
		vi.mocked(saveCheckSessionRecord)
			.mockRejectedValueOnce(saveError)
			.mockResolvedValueOnce(undefined)

		await expect(
			completeCheckSessionAiCheck({ buffer: png, checkSessionId: 41, user }),
		).rejects.toBe(saveError)
		expect(persistedSession.status).toBe('failed')
		expect(saveCheckSessionRecord).toHaveBeenNthCalledWith(2, persistedSession, user)
	})
})
