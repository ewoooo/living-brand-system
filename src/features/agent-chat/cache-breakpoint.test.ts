import type { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import {
	countCacheBreakpoints,
	stripCacheBreakpoint,
	withHistoryCacheBreakpoint,
} from './cache-breakpoint'

const user = (text: string): ModelMessage => ({ role: 'user', content: text })

describe('withHistoryCacheBreakpoint', () => {
	it('마지막 메시지에만 breakpoint를 달아 상한(4개)에 걸리지 않게 한다', () => {
		const first = withHistoryCacheBreakpoint([user('a'), user('b')])
		// 다음 스텝에서 이력이 늘어난 상태 — 이전 breakpoint는 떼고 새 끝에만 달려야 한다.
		const second = withHistoryCacheBreakpoint([...first, user('c'), user('d')])

		expect(countCacheBreakpoints(second)).toBe(1)
		expect(second.at(-1)?.providerOptions?.anthropic?.cacheControl).toEqual({
			type: 'ephemeral',
		})
		expect(second[1]?.providerOptions?.anthropic?.cacheControl).toBeUndefined()
	})

	it('빈 이력은 그대로 돌려준다', () => {
		expect(withHistoryCacheBreakpoint([])).toEqual([])
	})

	it('같은 공급자의 다른 옵션은 보존한다', () => {
		const messages: ModelMessage[] = [
			{
				role: 'user',
				content: 'a',
				providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' }, other: 1 } },
			},
			user('b'),
		]

		const [stripped] = withHistoryCacheBreakpoint(messages)

		expect(stripped?.providerOptions?.anthropic).toEqual({ other: 1 })
	})
})

describe('stripCacheBreakpoint', () => {
	it('breakpoint가 없으면 같은 객체를 그대로 돌려준다', () => {
		const message = user('a')

		expect(stripCacheBreakpoint(message)).toBe(message)
	})
})
