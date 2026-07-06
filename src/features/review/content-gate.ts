/**
 * 이미지에 어떤 디자인 요소가 포함됐는지 나타내는 플래그. 유저가 업로드 후 체크로 선택한다.
 * 서버 검수(run-review.service)가 이 플래그로 요소 종속 룰의 실행 여부를 정한다.
 */
export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = {
	logo: false,
	typography: false,
	illustration: false,
	photography: false,
}

/** 체크박스 UI 라벨 (안내 문구에도 재사용). 표시 순서도 이 순서를 따른다. */
export const CONTENT_FLAG_LABELS: Record<keyof ImageContentFlags, string> = {
	logo: 'Logo',
	typography: 'Typography',
	illustration: 'Illustration',
	photography: 'Photography',
}

/** 플래그가 지배하는 룰 key 접두사. 여기 없는 접두사(color, application 등)는 항상 검수한다. */
const FLAG_BY_RULE_PREFIX: [prefix: string, flag: keyof ImageContentFlags][] = [
	['logo.', 'logo'],
	['typography.', 'typography'],
	['illustration.', 'illustration'],
	['imagery.', 'photography'],
]

/** 룰이 요소 종속이면 해당 플래그가 켜져 있을 때만 검수한다. */
export function shouldCheckRule(ruleKey: string, flags: ImageContentFlags): boolean {
	const gate = FLAG_BY_RULE_PREFIX.find(([prefix]) => ruleKey.startsWith(prefix))
	return gate ? flags[gate[1]] : true
}
