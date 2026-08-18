import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyPageLink } from './copy-page-link'

function mockClipboard(writeText: () => Promise<void>) {
	const spy = vi.fn(writeText)
	Object.defineProperty(navigator, 'clipboard', { value: { writeText: spy }, configurable: true })
	return spy
}

/** 이 리포의 vitest.setup에는 auto-cleanup이 없다 — 안 지우면 다음 테스트가 버튼 두 개를 본다. */
afterEach(() => {
	cleanup()
	vi.useRealTimers()
})

beforeEach(() => {
	vi.useFakeTimers()
})

/** 클릭 뒤 await된 clipboard 약속을 흘려보낸다. `userEvent`는 fake timer와 물려 쓰지 않는다. */
async function click() {
	fireEvent.click(screen.getByRole('button'))
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0)
	})
}

const button = () => screen.getByRole('button')

describe('CopyPageLink', () => {
	it('현재 주소를 클립보드에 넣고 성공을 알린 뒤 원래 라벨로 돌아온다', async () => {
		const writeText = mockClipboard(() => Promise.resolve())
		render(<CopyPageLink />)

		await click()

		expect(writeText).toHaveBeenCalledWith(window.location.href)
		expect(button()).toHaveAccessibleName('링크를 복사했습니다')

		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000)
		})
		expect(button()).toHaveAccessibleName('페이지 링크 복사')
	})

	it('🔴 클립보드가 거절해도 조용히 넘어가지 않는다', async () => {
		// 보안 컨텍스트가 아니거나 권한이 없으면 거절된다. 실패를 안 알리면 눌렀는지도 모른다.
		mockClipboard(() => Promise.reject(new Error('denied')))
		render(<CopyPageLink />)

		await click()

		expect(button()).toHaveAccessibleName('복사하지 못했습니다')
	})

	it('접혀서 라벨이 안 보여도 버튼의 이름은 남는다', () => {
		mockClipboard(() => Promise.resolve())
		render(<CopyPageLink />)

		// 접힌 사이드바에서 라벨은 sr-only가 되지만 접근성 트리에는 그대로 있다.
		expect(button()).toHaveAccessibleName('페이지 링크 복사')
	})
})
