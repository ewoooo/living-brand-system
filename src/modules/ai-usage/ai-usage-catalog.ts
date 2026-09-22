/**
 * AI 사용량의 분류 축 — **이 파일이 정본이다.**
 *
 * 🔴 컬렉션의 `options`도, 화면의 라벨도 여기서 읽는다. 기능·스튜디오가 늘어날 때 고칠 자리를
 *    하나로 두기 위한 것이다 — 예전에는 컬렉션 enum과 화면의 `Record` 두 곳에 같은 목록이
 *    있어서, 하나를 더하면 다른 쪽이 조용히 낡았다.
 * 🔴 타입도 여기서 파생한다(`payload-types`에서 읽지 않는다). 방향이 반대가 되면 컬렉션이
 *    정본이 되어 화면이 다시 목록을 베껴 적게 된다.
 * 🔑 **모델은 여기 없다.** 모델 식별자는 provider가 정하고 수시로 늘어나므로 열거하지 않는다 —
 *    자유 문자열로 저장하고 화면은 받은 값을 그대로 찍는다.
 */

export interface AiUsageOption<Value extends string> {
	value: Value
	label: string
}

/** AI를 호출한 기능. 늘어나면 여기에만 추가하고 마이그레이션을 만든다. */
export const AI_USAGE_FEATURES = [
	{ label: '이미지 생성', value: 'image-generation' },
	{ label: '이미지 검수', value: 'asset-check' },
	{ label: '에이전트 대화', value: 'agent-chat' },
] as const satisfies readonly AiUsageOption<string>[]

/** 호출이 들어온 스튜디오 화면. 사용량 표가 이 순서로 행을 세운다. */
export const AI_USAGE_STUDIOS = [
	{ label: '이미지', value: 'image' },
	{ label: '그래픽', value: 'graphic' },
	{ label: '그래프', value: 'graph' },
	{ label: '템플릿', value: 'template' },
	{ label: '검수', value: 'review' },
	{ label: '자산', value: 'assets' },
	{ label: 'MCP', value: 'mcp' },
] as const satisfies readonly AiUsageOption<string>[]

export type AiUsageFeature = (typeof AI_USAGE_FEATURES)[number]['value']
export type AiUsageStudio = (typeof AI_USAGE_STUDIOS)[number]['value']

/** 스튜디오 밖에서 온 호출(admin 미리보기·전역 헤더 챗)을 표에서 부르는 이름. */
export const AI_USAGE_OUTSIDE_STUDIO_LABEL = '스튜디오 밖'

function labelOf(options: readonly AiUsageOption<string>[], value: string): string {
	// 🔴 모르는 값이면 원문을 돌려준다. 배포보다 데이터가 앞설 수 있고(먼저 들어온 새 기능),
	//    그때 화면이 빈칸을 그리면 사용량이 사라진 것처럼 보인다.
	return options.find((option) => option.value === value)?.label ?? value
}

export function aiUsageFeatureLabel(value: string): string {
	return labelOf(AI_USAGE_FEATURES, value)
}

export function aiUsageStudioLabel(value: string | null): string {
	return value === null ? AI_USAGE_OUTSIDE_STUDIO_LABEL : labelOf(AI_USAGE_STUDIOS, value)
}
