import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import ruleset from '../src/features/review/data/essenherb-ruleset.json'

/**
 * essenherb 룰셋 데이터 시드 (JSON → sections / guideline-pages / rules(+titleKo) / rule-bindings).
 * 전부 비즈니스 자연키 멱등 upsert + req 트랜잭션. 재실행/부분실패 안전.
 * - sections/guideline-pages: localized(기본 ko)·drafts → _status:'published', generateSlug:false, 안전한 slug 직접 지정.
 * - rules: key 유니크, titleKo 추가. 113 placement → 69 distinct key로 dedup(title=첫 등장, tier=가장 엄격).
 * - rule-bindings: (page, rule) 자연키. 배치별 value/evidence 보존.
 * 생성 순서 = 참조 의존성 순서(section→page→rule→binding).
 */

const TIER_MAP: Record<string, 'A' | 'B' | 'C'> = {
	automated: 'A',
	assisted: 'B',
	manual: 'C',
}
const TIER_RANK: Record<'A' | 'B' | 'C', number> = { A: 0, B: 1, C: 2 } // 낮을수록 엄격, 충돌 시 우선

type RuleCategory =
	| 'logo'
	| 'color'
	| 'typography'
	| 'grid'
	| 'spacing'
	| 'layout'
	| 'imagery'
	| 'illustration'
	| 'iconography'
	| 'motion'
	| 'voice'
	| 'messaging'
	| 'accessibility'
	| 'application'
	| 'misc'

const CATEGORY_OPTIONS = new Set<RuleCategory>([
	'logo',
	'color',
	'typography',
	'grid',
	'spacing',
	'layout',
	'imagery',
	'illustration',
	'iconography',
	'motion',
	'voice',
	'messaging',
	'accessibility',
	'application',
	'misc',
])

const toCategory = (c: string): RuleCategory =>
	CATEGORY_OPTIONS.has(c as RuleCategory) ? (c as RuleCategory) : 'misc'

const pageSlug = (page: number) => `p-${page}`

type Chapter = (typeof ruleset.chapters)[number]
type Section = Chapter['sections'][number]
type Page = Section['pages'][number]
type Rule = Page['rules'][number]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
	// 1) sections upsert (slug 자연키). slug → id 매핑 확보.
	const sectionIdBySlug = new Map<string, number>()
	let sectionOrder = 0
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			const found = await payload.find({
				collection: 'sections',
				where: { slug: { equals: section.slug } },
				limit: 1,
				depth: 0,
				req,
			})
			const doc = found.docs[0]
				? await payload.update({
						collection: 'sections',
						id: found.docs[0].id,
						data: { title: section.name, displayOrder: sectionOrder++, _status: 'published' },
						req,
					})
				: await payload.create({
						collection: 'sections',
						data: {
							title: section.name,
							slug: section.slug,
							displayOrder: sectionOrder++,
							generateSlug: false,
							_status: 'published',
						},
						req,
					})
			sectionIdBySlug.set(section.slug, doc.id as number)
		}
	}

	// 2) guideline-pages upsert (slug 'p-{page}' 자연키). page번호 → id 매핑.
	const pageIdByNumber = new Map<number, number>()
	let pageOrder = 0
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			const sectionId = sectionIdBySlug.get(section.slug)
			if (sectionId === undefined) throw new Error(`section id 없음: ${section.slug}`)
			for (const page of section.pages as Page[]) {
				const slug = pageSlug(page.page)
				const title = `${section.name} p.${page.page}`
				const found = await payload.find({
					collection: 'guideline-pages',
					where: { slug: { equals: slug } },
					limit: 1,
					depth: 0,
					req,
				})
				const doc = found.docs[0]
					? await payload.update({
							collection: 'guideline-pages',
							id: found.docs[0].id,
							data: { title, section: sectionId, displayOrder: pageOrder++, _status: 'published' },
							req,
						})
					: await payload.create({
							collection: 'guideline-pages',
							data: {
								title,
								slug,
								section: sectionId,
								displayOrder: pageOrder++,
								generateSlug: false,
								_status: 'published',
							},
							req,
						})
				pageIdByNumber.set(page.page, doc.id as number)
			}
		}
	}

	// 3) rules dedup(113→69) 후 upsert (key 자연키). key → id 매핑.
	const ruleByKey = new Map<
		string,
		{ title: string; titleKo: string; category: RuleCategory; tier: 'A' | 'B' | 'C' }
	>()
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages as Page[]) {
				for (const rule of page.rules as Rule[]) {
					const tier = TIER_MAP[rule.tier] ?? 'C'
					const category = toCategory(rule.category)
					const prev = ruleByKey.get(rule.key)
					if (!prev) {
						ruleByKey.set(rule.key, { title: rule.title, titleKo: rule.titleKo, category, tier })
					} else if (TIER_RANK[tier] < TIER_RANK[prev.tier]) {
						prev.tier = tier // 더 엄격한 tier로 승격
					}
				}
			}
		}
	}
	const ruleIdByKey = new Map<string, number>()
	for (const [key, r] of ruleByKey) {
		const found = await payload.find({
			collection: 'rules',
			where: { key: { equals: key } },
			limit: 1,
			depth: 0,
			req,
		})
		const data = { key, title: r.title, titleKo: r.titleKo, category: r.category, tier: r.tier }
		const doc = found.docs[0]
			? await payload.update({
					collection: 'rules',
					id: found.docs[0].id,
					// key/status 등 다른 필드는 건드리지 않고 seed 소유 필드만 갱신
					data: { title: r.title, titleKo: r.titleKo, category: r.category, tier: r.tier },
					req,
				})
			: await payload.create({ collection: 'rules', data: { ...data, status: 'live' }, req })
		ruleIdByKey.set(key, doc.id as number)
	}

	// 4) rule-bindings upsert ((page, rule) 자연키). 배치별 value/evidence.
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages as Page[]) {
				const pageId = pageIdByNumber.get(page.page)
				if (pageId === undefined) throw new Error(`page id 없음: ${page.page}`)
				for (const rule of page.rules as Rule[]) {
					const ruleId = ruleIdByKey.get(rule.key)
					if (ruleId === undefined) throw new Error(`rule id 없음: ${rule.key}`)
					const data = {
						page: pageId,
						rule: ruleId,
						value: rule.value || null,
						evidence: rule.evidence || null,
					}
					const found = await payload.find({
						collection: 'rule-bindings',
						where: { and: [{ page: { equals: pageId } }, { rule: { equals: ruleId } }] },
						limit: 1,
						depth: 0,
						req,
					})
					if (found.docs[0]) {
						await payload.update({
							collection: 'rule-bindings',
							id: found.docs[0].id,
							data: { value: data.value, evidence: data.evidence },
							req,
						})
					} else {
						await payload.create({ collection: 'rule-bindings', data, req })
					}
				}
			}
		}
	}
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
	// 비파괴 원칙: 명백히 seed가 만든 것만 제거. rules/sections는 사전 존재 가능 → 남긴다.
	// rule-bindings 전체(이 마이그레이션 전용 테이블) + 'p-{n}' 페이지만 삭제.
	await payload.delete({ collection: 'rule-bindings', where: {}, req })
	const pageSlugs = ruleset.chapters.flatMap((c) =>
		c.sections.flatMap((s) => (s.pages as Page[]).map((p) => pageSlug(p.page))),
	)
	for (const slug of pageSlugs) {
		await payload.delete({ collection: 'guideline-pages', where: { slug: { equals: slug } }, req })
	}
}
