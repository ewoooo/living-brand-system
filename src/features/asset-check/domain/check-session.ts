import type { AiUsage, CheckResult } from '@/features/asset-check/checkers/types'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import {
	type CheckImageMediaType,
	isSupportedCheckImageMediaType,
} from '@/features/asset-check/utils/image-format'
import type { CheckSession as CheckSessionRecord } from '@/payload-types'

/** 종결(completed/failed)된 세션에 전이를 시도했을 때의 방어선. 정상 경로에서는 나오지 않는다. */
export class CheckSessionStateError extends Error {}

/** failed 세션에 AI 후속 검수를 요청했을 때. API route가 409로 변환한다. */
export class CheckSessionTerminalError extends Error {}

/** 요청한 사용자가 소유한 CheckSession을 찾지 못했을 때. */
export class CheckSessionNotFoundError extends Error {}

/** AI 후속 요청의 이미지가 세션 시작 시점의 입력과 다를 때. */
export class CheckSessionInputMismatchError extends Error {}

export interface CheckSessionInputSnapshot {
	sha256: string
	mediaType: CheckImageMediaType
	byteLength: number
}

export interface CheckSessionUpdateData {
	status: CheckSessionRecord['status']
	results: Record<string, CheckResult>
	pendingCheckKeys: string[]
	aiUsage?: AiUsage
	errorMessage?: string
	completedAt?: string
}

/**
 * 검수 세션 Aggregate — running → completed/failed 전이와 결과 병합 규칙을 소유한다.
 * pending이 비는 순간 스스로 완료하며, 호출자는 완료 조건을 계산하지 않는다.
 * Payload 레코드와의 변환은 check-session repository만 수행한다.
 */
export class CheckSession {
	private constructor(
		readonly id: number,
		private _status: CheckSessionRecord['status'],
		private _results: Record<string, CheckResult>,
		private _pendingCheckKeys: string[],
		readonly rulesetSnapshot: RuntimeCheck[] | undefined,
		private readonly inputSnapshot: CheckSessionInputSnapshot | undefined,
		private _aiUsage: AiUsage | undefined,
		private _errorMessage: string | undefined,
		private _completedAt: string | undefined,
	) {}

	static fromRecord(record: CheckSessionRecord): CheckSession {
		const inputMediaType = record.inputMediaType
		let inputSnapshot: CheckSessionInputSnapshot | undefined
		if (
			typeof record.inputSha256 === 'string' &&
			typeof inputMediaType === 'string' &&
			isSupportedCheckImageMediaType(inputMediaType) &&
			typeof record.inputByteLength === 'number'
		) {
			inputSnapshot = {
				sha256: record.inputSha256,
				mediaType: inputMediaType,
				byteLength: record.inputByteLength,
			}
		}

		return new CheckSession(
			record.id,
			record.status,
			(record.results ?? {}) as Record<string, CheckResult>,
			Array.isArray(record.pendingCheckKeys)
				? record.pendingCheckKeys.filter((key): key is string => typeof key === 'string')
				: [],
			Array.isArray(record.rulesetSnapshot)
				? (record.rulesetSnapshot as RuntimeCheck[])
				: undefined,
			inputSnapshot,
			(record.aiUsage ?? undefined) as AiUsage | undefined,
			record.errorMessage ?? undefined,
			record.completedAt ?? undefined,
		)
	}

	get status() {
		return this._status
	}

	get results(): Record<string, CheckResult> {
		return this._results
	}

	get pendingCheckKeys(): string[] {
		return [...this._pendingCheckKeys]
	}

	get isCompleted() {
		return this._status === 'completed'
	}

	get isFailed() {
		return this._status === 'failed'
	}

	/** 세션에 고정된 입력 지문과 후속 요청의 실제 바이트가 같은지 검증한다. */
	assertInputMatches(actual: CheckSessionInputSnapshot): void {
		if (
			!this.inputSnapshot ||
			this.inputSnapshot.sha256 !== actual.sha256 ||
			this.inputSnapshot.mediaType !== actual.mediaType ||
			this.inputSnapshot.byteLength !== actual.byteLength
		) {
			throw new CheckSessionInputMismatchError('Check session input does not match.')
		}
	}

	/** 즉시(deterministic/manual) 판정 결과와 남은 AI Check 목록을 반영한다. */
	applyImmediateResults(input: {
		results: Record<string, CheckResult>
		pendingCheckKeys: string[]
	}): void {
		this.assertRunning('applyImmediateResults')
		this._results = { ...this._results, ...input.results }
		this._pendingCheckKeys = [...input.pendingCheckKeys]
		this.completeIfDone()
	}

	/** AI 판정 결과를 병합하고 판정된 키를 pending에서 제거한다. */
	applyAiResults(input: { results: Record<string, CheckResult>; aiUsage?: AiUsage }): void {
		this.assertRunning('applyAiResults')
		this._results = { ...this._results, ...input.results }
		const applied = new Set(Object.keys(input.results))
		this._pendingCheckKeys = this._pendingCheckKeys.filter((key) => !applied.has(key))
		if (input.aiUsage) this._aiUsage = input.aiUsage
		this.completeIfDone()
	}

	fail(errorMessage: string): void {
		this.assertRunning('fail')
		this._status = 'failed'
		this._errorMessage = errorMessage
		this._completedAt = new Date().toISOString()
	}

	/** Repository 전용 — 갱신 대상 필드만 뽑는다. */
	toUpdateData(): CheckSessionUpdateData {
		return {
			status: this._status,
			results: this._results,
			pendingCheckKeys: this._pendingCheckKeys,
			aiUsage: this._aiUsage,
			errorMessage: this._errorMessage,
			completedAt: this._completedAt,
		}
	}

	private completeIfDone(): void {
		if (this._pendingCheckKeys.length > 0) return
		this._status = 'completed'
		this._completedAt = new Date().toISOString()
	}

	private assertRunning(action: string): void {
		if (this._status !== 'running') {
			throw new CheckSessionStateError(`${action}: session is ${this._status}, not running`)
		}
	}
}
