import { cache } from 'react'
import { getChecker } from '@/features/review/checkers/registry'
import {
	getReviewRuleDocs,
	getReviewRulesetPages,
} from '@/features/review/repositories/review-ruleset.payload.repository'
import type { ApplicationImage, Rule } from '@/payload-types'

export interface ReviewReferenceAsset {
	name: string
	url: string
	mimeType: string
}

export interface ReviewRule {
	key: string
	title: string
	executor: NonNullable<Rule['executor']>
	/** 자동 검수 가능 여부 — deterministic인데 checker 미등록이면 false (UI 배지용). */
	implemented: boolean
	evidence: string
	referenceAssets: ReviewReferenceAsset[]
}

/** 검수 화면의 그룹 단위 = 룰 배치를 가진 가이드라인 페이지 (The Name, Brand Logo, …). */
export interface ReviewSection {
	title: string
	slug: string
	rules: ReviewRule[]
}

/**
 * 검수 화면용 룰셋 뷰모델 — 페이지의 rules 배치를 그대로 묶는다 (목차·본문·검수 대상의 단일 소스).
 * 정렬: 섹션 displayOrder → 페이지 displayOrder → 배치 순서. Payload 접근은 repository가 소유한다.
 * layout과 page가 같은 요청에서 함께 부르므로 React cache로 요청당 1회만 조회한다.
 */
export const getReviewRuleset = cache(async (): Promise<ReviewSection[]> => {
	const pages = await getReviewRulesetPages()

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
			rules: (page.rules ?? []).flatMap((placement) =>
				typeof placement.rule === 'number' ? [] : [toReviewRule(placement.rule)],
			),
		}))
})

/**
 * 검수 실행용 룰 스냅샷 read service — ruleKeys가 있으면 그 순서대로 필터·정렬해 반환한다.
 * Payload 조회는 review-ruleset repository가 소유한다.
 */
export async function getReviewRules(ruleKeys?: string[]): Promise<ReviewRule[]> {
	const rules = (await getReviewRuleDocs()).map(toReviewRule)
	if (!ruleKeys) return rules
	const order = new Map(ruleKeys.map((key, index) => [key, index]))
	return rules
		.filter((rule) => order.has(rule.key))
		.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0))
}

function toReviewRule(rule: Rule): ReviewRule {
	const executor = rule.executor ?? 'deterministic'
	return {
		key: rule.key,
		title: rule.title,
		executor,
		// 서버에서 계산해 내려보낸다 — 클라이언트가 checker registry를 import하지 않게.
		implemented: executor !== 'deterministic' || getChecker(rule.key) !== null,
		evidence: rule.evidence ?? '',
		referenceAssets: (rule.referenceAssets ?? []).flatMap(toReferenceAsset),
	}
}

function toReferenceAsset(asset: number | ApplicationImage): ReviewReferenceAsset[] {
	if (typeof asset === 'number' || !asset.url || !asset.mimeType) return []
	return [
		{
			name: asset.name,
			url: asset.url,
			mimeType: asset.mimeType,
		},
	]
}
