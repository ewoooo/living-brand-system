import type { ModelMessage } from 'ai'

/**
 * Anthropic 프롬프트 캐시 breakpoint를 메시지 이력에 얹는 순수 함수 — 에이전트 파일에 두면
 * payload config와 tool 전체를 끌고 와 테스트할 수 없어 여기에 둔다. 외부 I/O 없음.
 */

const CACHE_BREAKPOINT_PROVIDER_OPTIONS = {
	anthropic: { cacheControl: { type: 'ephemeral' } },
} as const

export { CACHE_BREAKPOINT_PROVIDER_OPTIONS }

/**
 * 스텝마다 늘어나는 이력의 끝으로 breakpoint를 옮겨 단다 — tool 결과가 누적되면 한 스텝이
 * 10만 토큰을 넘기는데, system 프리픽스만 캐시하면 그 대부분이 매 스텝 새 값으로 다시 청구된다.
 * 직전 스텝이 써둔 캐시는 breakpoint를 떼도 남으므로, 옮겨 달아야 상한(4개)에 걸리지 않는다.
 * 불변식: 반환된 이력의 메시지 breakpoint는 언제나 정확히 하나(마지막)다.
 */
export function withHistoryCacheBreakpoint(messages: ModelMessage[]): ModelMessage[] {
	const last = messages.at(-1)
	if (!last) return messages

	return [
		...messages.slice(0, -1).map(stripCacheBreakpoint),
		{
			...last,
			providerOptions: { ...last.providerOptions, ...CACHE_BREAKPOINT_PROVIDER_OPTIONS },
		},
	]
}

/** breakpoint만 떼고 같은 공급자의 다른 옵션은 보존한다. */
export function stripCacheBreakpoint(message: ModelMessage): ModelMessage {
	if (!message.providerOptions?.anthropic?.cacheControl) return message

	const { cacheControl: _removed, ...anthropic } = message.providerOptions.anthropic

	return { ...message, providerOptions: { ...message.providerOptions, anthropic } }
}

/** 이력 전체에서 breakpoint가 달린 메시지 수 — 상한 위반을 테스트가 볼 수 있게 한다. */
export function countCacheBreakpoints(messages: ModelMessage[]): number {
	return messages.filter((message) => message.providerOptions?.anthropic?.cacheControl).length
}
