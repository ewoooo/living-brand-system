import type { LazyResourceStatus } from '@/hooks/use-lazy-resource'

/**
 * 자산 브라우저 패널의 빈 자리 문구 — 목록은 패널이 열릴 때 오므로 "비었다"에 세 가지 사연이 있다.
 * 재시도 버튼을 따로 두지 않는 이유: 닫았다 열면 다시 가져오므로 이미 있는 조작으로 충분하다.
 */
export function browseEmptyMessage(
	status: LazyResourceStatus,
	hasOptions: boolean,
	nothingToPick: string,
): string | undefined {
	if (status === 'error') return '목록을 불러오지 못했습니다. 패널을 닫았다 다시 열어 주세요.'
	if (status !== 'ready') return '목록을 불러오는 중입니다…'
	return hasOptions ? undefined : nothingToPick
}
