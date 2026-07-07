import { cache } from 'react'
import { hasChecker } from '@/features/asset-check/checkers/registry'
import type { CheckStatus } from '@/features/asset-check/checkers/types'
import {
	getCheckRuleDocs,
	getCheckRulesetPages,
} from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import type { ApplicationImage, Rule } from '@/payload-types'

/**
 * 룰별 상태 메시지 패턴 — checker facts({facts.x})를 치환해 사용자 문구를 만든다.
 * 패턴이 없는 룰은 checker detail을 그대로 노출한다. 장기적으로는 Rule 컬렉션 필드로 이전 후보.
 */
const CHECK_RULE_MESSAGES: Record<string, Partial<Record<CheckStatus, string>>> = {
	'application.stationery.format': {
		pass: '{facts.closestFormat} 규격 비율에 맞습니다.',
		fail: '캔버스가 스테이셔너리 규격과 다릅니다. {facts.allowedFormats} 중 선택한 산출물 규격에 맞춰 조정하세요.',
	},
}

export interface CheckReferenceAsset {
	name: string
	url: string
	mimeType: string
}

export interface CheckRule {
	key: string
	title: string
	executor: NonNullable<Rule['executor']>
	/** 자동 검수 가능 여부 — deterministic인데 checker 미등록이면 false (UI 배지용). */
	implemented: boolean
	evidence: string
	referenceAssets: CheckReferenceAsset[]
	messages?: Partial<Record<CheckStatus, string>>
}

/** 검수 화면의 그룹 단위 = 룰 배치를 가진 가이드라인 페이지 (The Name, Brand Logo, …). */
export interface CheckSection {
	title: string
	slug: string
	groupTitle: string
	groupSlug: string
	rules: CheckRule[]
}

/**
 * 검수 화면용 룰셋 뷰모델 — 페이지의 rules 배치를 그대로 묶는다 (목차·본문·검수 대상의 단일 소스).
 * 정렬: 섹션 displayOrder → 페이지 displayOrder → 배치 순서. Payload 접근은 repository가 소유한다.
 * layout과 page가 같은 요청에서 함께 부르므로 React cache로 요청당 1회만 조회한다.
 */
export const getCheckRuleset = cache(async (): Promise<CheckSection[]> => {
	const pages = await getCheckRulesetPages()

	return pages
		.filter((page) => (page.rules?.length ?? 0) > 0)
		.sort((a, b) => {
			const sectionOrder = (page: (typeof pages)[number]) =>
				typeof page.section === 'number' ? 0 : page.section.displayOrder
			return sectionOrder(a) - sectionOrder(b) || a.displayOrder - b.displayOrder
		})
		.map((page) => ({
			title: page.title,
			slug: page.slug ?? String(page.id),
			...toCheckGroup(page.section),
			rules: (page.rules ?? []).flatMap((placement) =>
				typeof placement.rule === 'number' ? [] : [toCheckRule(placement.rule)],
			),
		}))
})

/**
 * 검수 실행용 룰 스냅샷 read service — ruleKeys가 있으면 그 순서대로 필터·정렬해 반환한다.
 * Payload 조회는 check-ruleset repository가 소유한다.
 */
export async function getCheckRules(ruleKeys?: string[]): Promise<CheckRule[]> {
	const rules = (await getCheckRuleDocs()).map(toCheckRule)
	if (!ruleKeys) return rules
	const order = new Map(ruleKeys.map((key, index) => [key, index]))
	return rules
		.filter((rule) => order.has(rule.key))
		.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
}

function toCheckRule(rule: Rule): CheckRule {
	const executor = rule.executor ?? 'deterministic'
	return {
		key: rule.key,
		title: rule.title,
		executor,
		// 서버에서 계산해 내려보낸다 — 클라이언트가 checker registry를 import하지 않게.
		implemented: executor !== 'deterministic' || hasChecker(rule.key),
		evidence: rule.evidence ?? '',
		referenceAssets: (rule.referenceAssets ?? []).flatMap(toReferenceAsset),
		messages: CHECK_RULE_MESSAGES[rule.key],
	}
}

function toCheckGroup(
	section: Awaited<ReturnType<typeof getCheckRulesetPages>>[number]['section'],
) {
	if (typeof section === 'number') {
		return { groupTitle: 'Check', groupSlug: 'check' }
	}
	return {
		groupTitle: section.title,
		groupSlug: section.slug ?? String(section.id),
	}
}

function toReferenceAsset(asset: number | ApplicationImage): CheckReferenceAsset[] {
	if (typeof asset === 'number' || !asset.url || !asset.mimeType) return []
	return [
		{
			name: asset.name,
			url: asset.url,
			mimeType: asset.mimeType,
		},
	]
}
