import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckSession as CheckSessionRecord } from '@/payload-types'
import {
	CheckSession,
	CheckSessionInputMismatchError,
	CheckSessionStateError,
} from './check-session'

function checkResult(key: string): CheckResult {
	return {
		rule: { key, title: key, executor: 'heuristic' },
		checker: { key: 'ai', type: 'ai' },
		rawResult: { status: 'needs_review', fulfillment: null, detail: '테스트' },
		message: '테스트',
	}
}

function record(overrides: Partial<CheckSessionRecord> = {}): CheckSessionRecord {
	return {
		id: 1,
		source: 'review-page',
		status: 'running',
		targetType: 'uploaded-image',
		createdAt: '2026-07-15T00:00:00.000Z',
		updatedAt: '2026-07-15T00:00:00.000Z',
		...overrides,
	}
}

describe('CheckSession aggregate', () => {
	it('즉시 결과 적용 후 pending이 남으면 running을 유지한다', () => {
		const session = CheckSession.fromRecord(record())
		session.applyImmediateResults({
			results: { a: checkResult('a') },
			pendingCheckKeys: ['b'],
		})
		expect(session.status).toBe('running')
		expect(session.pendingCheckKeys).toEqual(['b'])
		expect(session.toUpdateData().completedAt).toBeUndefined()
	})

	it('pending이 비면 자동으로 completed가 되고 completedAt을 기록한다', () => {
		const session = CheckSession.fromRecord(record())
		session.applyImmediateResults({
			results: { a: checkResult('a') },
			pendingCheckKeys: [],
		})
		expect(session.status).toBe('completed')
		expect(session.isCompleted).toBe(true)
		expect(session.toUpdateData().completedAt).toEqual(expect.any(String))
	})

	it('AI 결과 적용 시 해당 키를 pending에서 제거하고 결과를 병합한다', () => {
		const session = CheckSession.fromRecord(
			record({ results: { a: checkResult('a') }, pendingCheckKeys: ['b', 'c'] }),
		)
		session.applyAiResults({ results: { b: checkResult('b') } })
		expect(session.status).toBe('running')
		expect(session.pendingCheckKeys).toEqual(['c'])

		session.applyAiResults({ results: { c: checkResult('c') }, aiUsage: { model: 'm' } })
		expect(session.status).toBe('completed')
		expect(Object.keys(session.results).sort()).toEqual(['a', 'b', 'c'])
		expect(session.toUpdateData().aiUsage).toEqual({ model: 'm' })
	})

	it('종결된 세션에 전이를 시도하면 CheckSessionStateError를 던진다', () => {
		const completed = CheckSession.fromRecord(record({ status: 'completed' }))
		expect(() => completed.applyAiResults({ results: {} })).toThrow(CheckSessionStateError)
		expect(() => completed.fail('boom')).toThrow(CheckSessionStateError)

		const failed = CheckSession.fromRecord(record({ status: 'failed' }))
		expect(() => failed.applyImmediateResults({ results: {}, pendingCheckKeys: [] })).toThrow(
			CheckSessionStateError,
		)
	})

	it('fail은 errorMessage와 completedAt을 기록한다', () => {
		const session = CheckSession.fromRecord(record())
		session.fail('boom')
		expect(session.isFailed).toBe(true)
		expect(session.toUpdateData().errorMessage).toBe('boom')
		expect(session.toUpdateData().completedAt).toEqual(expect.any(String))
	})

	it('fromRecord는 pendingCheckKeys가 없는 과거 레코드를 빈 배열로 복원한다', () => {
		const session = CheckSession.fromRecord(record())
		expect(session.pendingCheckKeys).toEqual([])
	})

	it('저장된 입력 지문과 SHA-256·형식·크기가 모두 같아야 후속 검수를 허용한다', () => {
		const snapshot = {
			sha256: 'a'.repeat(64),
			mediaType: 'image/png' as const,
			byteLength: 8,
		}
		const session = CheckSession.fromRecord(
			record({
				inputSha256: snapshot.sha256,
				inputMediaType: snapshot.mediaType,
				inputByteLength: snapshot.byteLength,
			}),
		)

		expect(() => session.assertInputMatches(snapshot)).not.toThrow()
		for (const mismatch of [
			{ ...snapshot, sha256: 'b'.repeat(64) },
			{ ...snapshot, mediaType: 'image/jpeg' as const },
			{ ...snapshot, byteLength: 9 },
		]) {
			expect(() => session.assertInputMatches(mismatch)).toThrow(
				CheckSessionInputMismatchError,
			)
		}
	})

	it('입력 지문이 없는 과거 세션은 새 이미지로 추정하지 않는다', () => {
		const session = CheckSession.fromRecord(record())

		expect(() =>
			session.assertInputMatches({
				sha256: 'a'.repeat(64),
				mediaType: 'image/png',
				byteLength: 8,
			}),
		).toThrow(CheckSessionInputMismatchError)
	})
})
