import type { CheckStatus } from '@/features/asset-check/checkers/types'

export type CheckRuleMessages = Partial<Record<CheckStatus, string>>

export const CHECK_RULE_MESSAGES: Record<string, CheckRuleMessages> = {
	'application.stationery.format': {
		pass: '{facts.closestFormat} 규격 비율에 맞습니다.',
		fail: '캔버스가 스테이셔너리 규격과 다릅니다. {facts.allowedFormats} 중 선택한 산출물 규격에 맞춰 조정하세요.',
	},
}
