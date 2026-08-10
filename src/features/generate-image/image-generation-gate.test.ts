import { describe, expect, it, vi } from 'vitest'

// 모듈 수준 상태(동시 실행·사용자 창)를 테스트마다 새로 시작한다.
async function loadGate() {
	vi.resetModules()
	return import('./image-generation-gate')
}

describe('image generation gate', () => {
	it('프로세스 동시 생성은 두 건까지만 허용하고 release를 중복 적용하지 않는다', async () => {
		const { acquireImageGenerationSlot, ImageGenerationLimitError } = await loadGate()

		const releaseFirst = acquireImageGenerationSlot(1, 0)
		const releaseSecond = acquireImageGenerationSlot(2, 0)

		expect(() => acquireImageGenerationSlot(3, 0)).toThrow(ImageGenerationLimitError)
		releaseFirst()
		releaseFirst()
		const releaseThird = acquireImageGenerationSlot(3, 0)

		releaseSecond()
		releaseThird()
	})

	it('사용자별 분당 여섯 요청까지만 허용하고 창이 지나면 다시 허용한다', async () => {
		const { acquireImageGenerationSlot, ImageGenerationLimitError } = await loadGate()

		for (let count = 0; count < 6; count += 1) {
			acquireImageGenerationSlot(1, 0)()
		}
		expect(() => acquireImageGenerationSlot(1, 0)).toThrow(ImageGenerationLimitError)
		expect(() => acquireImageGenerationSlot(2, 0)).not.toThrow()
		expect(() => acquireImageGenerationSlot(1, 60_000)).not.toThrow()
	})

	it('한도 초과 오류에 창이 리셋될 때까지 남은 초를 담는다', async () => {
		const { acquireImageGenerationSlot, ImageGenerationLimitError } = await loadGate()

		for (let count = 0; count < 6; count += 1) {
			acquireImageGenerationSlot(1, 0)()
		}

		try {
			acquireImageGenerationSlot(1, 45_500)
			expect.unreachable()
		} catch (error) {
			if (!(error instanceof ImageGenerationLimitError)) throw error
			expect(error.retryAfterSeconds).toBe(15)
		}
	})
})
