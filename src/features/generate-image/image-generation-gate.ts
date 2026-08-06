const RATE_WINDOW_MS = 60_000
const MAX_GENERATIONS_PER_USER = 6
const MAX_ACTIVE_GENERATIONS = 2
const MAX_RATE_USERS = 1_000

let activeGenerations = 0
const userWindows = new Map<number, { count: number; resetAt: number }>()

/** 이미지 생성 요청이 현재 처리 한도를 넘었음을 호출 표면에 알린다. */
export class ImageGenerationLimitError extends Error {
	constructor(readonly retryAfterSeconds: number) {
		super(`Image generation limit reached. Retry after ${retryAfterSeconds}s.`)
		this.name = 'ImageGenerationLimitError'
	}
}

/**
 * 유료 이미지 모델 호출 전에 사용자별 rate limit과 프로세스 동시 실행 한도를 확보한다.
 * 반환된 release는 호출 완료(성공·실패 무관) 시 반드시 실행해야 한다.
 * ponytail: process-local 제한이다. 서버 인스턴스가 둘 이상이면 공유 edge/Redis limiter로 교체한다.
 */
export function acquireImageGenerationSlot(userId: number, now = Date.now()): () => void {
	if (activeGenerations >= MAX_ACTIVE_GENERATIONS) {
		throw new ImageGenerationLimitError(1)
	}

	const current = userWindows.get(userId)
	const window =
		!current || now >= current.resetAt ? { count: 0, resetAt: now + RATE_WINDOW_MS } : current
	if (window.count >= MAX_GENERATIONS_PER_USER) {
		throw new ImageGenerationLimitError(Math.max(1, Math.ceil((window.resetAt - now) / 1_000)))
	}

	if (!userWindows.has(userId) && userWindows.size >= MAX_RATE_USERS) {
		const oldestUserId = userWindows.keys().next().value
		if (oldestUserId !== undefined) userWindows.delete(oldestUserId)
	}
	window.count += 1
	userWindows.set(userId, window)
	activeGenerations += 1

	let released = false
	return () => {
		if (released) return
		released = true
		activeGenerations -= 1
	}
}
