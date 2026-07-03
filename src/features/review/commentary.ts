import type { RuleMetric } from '@/features/review/checkers/types'

/**
 * AI 코멘터리 — 미통과(fail) 룰에 대해 "기준 대비 현재값"을 사람 친화 문장으로 설명한다.
 * 지금은 ruleKey별 정적 템플릿 + checker 측정값(RuleMetric) 주입(결정적)이며,
 * 향후 정적/AI 추론 중 무엇으로 채우든 이 함수 뒤로 격리해 교체 가능하게 둔다.
 * 문구 수정·번역·톤 조정은 전부 이 파일에서. Pass 룰은 코멘터리를 달지 않는다.
 */
type CommentaryFn = (metric: RuleMetric) => string

const COMMENTARY: Record<string, CommentaryFn> = {
	'logo.clear-space': (m) =>
		`로고 주변에는 최소 ${m.expected}의 여백이 필요한데, 현재 ${m.actual}입니다.`,
	'logo.min-size': (m) =>
		`로고가 너무 작습니다. 프레임 대비 최소 ${m.expected}가 필요한데, 현재 ${m.actual}입니다.`,
	'color.palette': (m) =>
		`지정 팔레트를 벗어난 색이 있습니다. 규정 외 색은 ${m.expected}여야 하는데, 현재 ${m.actual}입니다.`,
	'color.pairing': (m) =>
		`색 조합의 대비가 부족합니다. ${m.expected}이 필요한데, 현재 ${m.actual}입니다.`,
	'application.format': (m) =>
		`명함 규격 비율에서 벗어났습니다. 목표는 ${m.expected}인데, 현재 ${m.actual}입니다.`,
	'application.print-spec': (m) =>
		`별색 1도(Red+White)만 허용되는데 규정 외 색이 감지됐습니다 (허용 ${m.expected}, 현재 ${m.actual}).`,
	'imagery.background-tone': (m) =>
		`배경이 밝은 무채색 기준에서 벗어났습니다. 기준은 ${m.expected}인데, 현재 ${m.actual}입니다.`,
}

/** 미통과 룰의 코멘터리 문장. 템플릿·metric이 없으면 null. */
export function getCommentary(ruleKey: string, metric: RuleMetric | undefined): string | null {
	if (!metric) return null
	const template = COMMENTARY[ruleKey]
	return template ? template(metric) : null
}
