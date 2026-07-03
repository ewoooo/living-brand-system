import type { RuleMetric } from '@/features/review/checkers/types'

/**
 * 검수 결과를 사람 친화 문장으로 바꾸는 코멘터리 템플릿.
 * 매번 LLM 추론이 아니라 ruleKey별 정형 템플릿 + checker가 계산한 측정값(RuleMetric) 주입 → 결정적.
 * 문구 수정·번역·톤 조정은 전부 이 파일 한 곳에서 한다 (checker는 값만 채운다).
 */
type CommentaryStatus = 'pass' | 'fail'
type CommentaryFn = (metric: RuleMetric, status: CommentaryStatus) => string

const COMMENTARY: Record<string, CommentaryFn> = {
	'logo.clear-space': (m, s) =>
		s === 'pass'
			? `로고 주변에 최소 ${m.expected}의 여백을 확보했습니다 (현재 ${m.actual}).`
			: `로고 주변에는 최소 ${m.expected}의 여백이 필요한데, 현재 ${m.actual}입니다.`,
	'logo.min-size': (m, s) =>
		s === 'pass'
			? `로고 크기가 충분합니다. 프레임 대비 최소 ${m.expected} 이상이어야 하는데, 현재 ${m.actual}입니다.`
			: `로고가 너무 작습니다. 프레임 대비 최소 ${m.expected}가 필요한데, 현재 ${m.actual}입니다.`,
	'color.palette': (m, s) =>
		s === 'pass'
			? `지정 팔레트를 잘 지켰습니다. 규정 외 색이 허용치(${m.expected}) 안인 ${m.actual}입니다.`
			: `지정 팔레트를 벗어난 색이 있습니다. 규정 외 색은 ${m.expected}여야 하는데, 현재 ${m.actual}입니다.`,
	'color.pairing': (m, s) =>
		s === 'pass'
			? `색 조합의 대비가 충분합니다 (${m.expected}, 현재 ${m.actual}).`
			: `색 조합의 대비가 부족합니다. ${m.expected}이 필요한데, 현재 ${m.actual}입니다.`,
	'application.format': (m, s) =>
		s === 'pass'
			? `명함 규격 비율을 지켰습니다 (목표 ${m.expected}, 현재 ${m.actual}).`
			: `명함 규격 비율에서 벗어났습니다. 목표는 ${m.expected}인데, 현재 ${m.actual}입니다.`,
	'application.print-spec': (m, s) =>
		s === 'pass'
			? `별색 1도(Red+White) 규정을 지켰습니다. 규정 외 색이 ${m.actual}입니다.`
			: `별색 1도(Red+White)만 허용되는데 규정 외 색이 감지됐습니다 (허용 ${m.expected}, 현재 ${m.actual}).`,
	'imagery.background-tone': (m, s) =>
		s === 'pass'
			? `배경이 밝은 무채색 기준을 충족합니다 (${m.actual}).`
			: `배경이 밝은 무채색 기준에서 벗어났습니다. 기준은 ${m.expected}인데, 현재 ${m.actual}입니다.`,
}

/**
 * ruleKey와 측정값으로 코멘터리 문장을 만든다. 템플릿·metric이 없으면 null (기존 detail로 폴백).
 */
export function getCommentary(
	ruleKey: string,
	metric: RuleMetric | undefined,
	status: CommentaryStatus,
): string | null {
	if (!metric) return null
	const template = COMMENTARY[ruleKey]
	return template ? template(metric, status) : null
}
