import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import ruleset from './data/essenherb-ruleset.json'

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

type Executor = 'deterministic' | 'heuristic' | 'advisory'
// executor 미지정 룰은 tier에서 유도한다 (A=자동판정, B=AI 판정, C=담당자 확인).
// 누락 시 조회층이 deterministic으로 강등해 checker 없는 룰이 검수에서 조용히 빠진다.
const EXECUTOR_BY_TIER: Record<'A' | 'B' | 'C', Executor> = {
	A: 'deterministic',
	B: 'heuristic',
	C: 'advisory',
}
const EXECUTOR_OPTIONS = new Set<Executor>(['deterministic', 'heuristic', 'advisory'])

const toExecutor = (value: unknown): Executor | null =>
	EXECUTOR_OPTIONS.has(value as Executor) ? (value as Executor) : null

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

type Db = MigrateUpArgs['db']

async function upsertSection(
	db: Db,
	section: Section,
	displayOrder: number,
): Promise<number> {
	const found = await db.execute(sql`
		SELECT gs.id
		FROM guideline_sections gs
		JOIN guideline_sections_locales gsl ON gsl._parent_id = gs.id AND gsl._locale = 'ko'
		WHERE gsl.slug = ${section.slug}
		LIMIT 1`)
	const existing = found.rows[0] as { id: number } | undefined
	if (existing) {
		await db.execute(sql`
			UPDATE guideline_sections
			SET display_order = ${displayOrder}, _status = 'published'::enum_guideline_sections_status, updated_at = now()
			WHERE id = ${existing.id}`)
		await db.execute(sql`
			UPDATE guideline_sections_locales
			SET title = ${section.name}, generate_slug = false, slug = ${section.slug}
			WHERE _parent_id = ${existing.id} AND _locale = 'ko'`)
		return existing.id
	}
	const inserted = await db.execute(sql`
		INSERT INTO guideline_sections (display_order, _status, updated_at, created_at)
		VALUES (${displayOrder}, 'published'::enum_guideline_sections_status, now(), now())
		RETURNING id`)
	const id = (inserted.rows[0] as { id: number }).id
	await db.execute(sql`
		INSERT INTO guideline_sections_locales (title, generate_slug, slug, _locale, _parent_id)
		VALUES (${section.name}, false, ${section.slug}, 'ko', ${id})`)
	return id
}

async function upsertPage(
	db: Db,
	page: { sectionId: number; title: string; slug: string; displayOrder: number },
): Promise<number> {
	const found = await db.execute(sql`
		SELECT gp.id
		FROM guideline_pages gp
		JOIN guideline_pages_locales gpl ON gpl._parent_id = gp.id AND gpl._locale = 'ko'
		WHERE gpl.slug = ${page.slug}
		LIMIT 1`)
	const existing = found.rows[0] as { id: number } | undefined
	if (existing) {
		await db.execute(sql`
			UPDATE guideline_pages
			SET section_id = ${page.sectionId}, display_order = ${page.displayOrder},
			    _status = 'published'::enum_guideline_pages_status, updated_at = now()
			WHERE id = ${existing.id}`)
		await db.execute(sql`
			UPDATE guideline_pages_locales
			SET title = ${page.title}, generate_slug = false, slug = ${page.slug}
			WHERE _parent_id = ${existing.id} AND _locale = 'ko'`)
		return existing.id
	}
	const inserted = await db.execute(sql`
		INSERT INTO guideline_pages (section_id, display_order, _status, updated_at, created_at)
		VALUES (${page.sectionId}, ${page.displayOrder}, 'published'::enum_guideline_pages_status, now(), now())
		RETURNING id`)
	const id = (inserted.rows[0] as { id: number }).id
	await db.execute(sql`
		INSERT INTO guideline_pages_locales (title, generate_slug, slug, _locale, _parent_id)
		VALUES (${page.title}, false, ${page.slug}, 'ko', ${id})`)
	return id
}

async function upsertRule(
	db: Db,
	rule: {
		key: string
		title: string
		titleKo: string
		category: RuleCategory
		tier: 'A' | 'B' | 'C'
		executor: Executor
	},
): Promise<number> {
	const inserted = await db.execute(sql`
		INSERT INTO rules (key, title, title_ko, category, tier, executor, status, updated_at, created_at)
		VALUES (
			${rule.key},
			${rule.title},
			${rule.titleKo},
			${rule.category}::enum_rules_category,
			${rule.tier}::enum_rules_tier,
			${rule.executor}::enum_rules_executor,
			'live'::enum_rules_status,
			now(),
			now()
		)
		ON CONFLICT (key) DO UPDATE SET
			title = excluded.title,
			title_ko = excluded.title_ko,
			category = excluded.category,
			tier = excluded.tier,
			executor = excluded.executor,
			updated_at = now()
		RETURNING id`)
	return (inserted.rows[0] as { id: number }).id
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
	// 1) sections upsert (slug 자연키). slug → id 매핑 확보.
	const sectionIdBySlug = new Map<string, number>()
	let sectionOrder = 0
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			sectionIdBySlug.set(section.slug, await upsertSection(db, section, sectionOrder++))
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
				pageIdByNumber.set(
					page.page,
					await upsertPage(db, { sectionId, title, slug, displayOrder: pageOrder++ }),
				)
			}
		}
	}

	// 3) rules dedup(113→69) 후 upsert (key 자연키). key → id 매핑.
	const ruleByKey = new Map<
		string,
		{
			title: string
			titleKo: string
			category: RuleCategory
			tier: 'A' | 'B' | 'C'
			explicitExecutor: Executor | null
		}
	>()
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages as Page[]) {
				for (const rule of page.rules as Rule[]) {
					const tier = TIER_MAP[rule.tier] ?? 'C'
					const category = toCategory(rule.category)
					const explicitExecutor = toExecutor((rule as { executor?: unknown }).executor)
					const prev = ruleByKey.get(rule.key)
					if (!prev) {
						ruleByKey.set(rule.key, {
							title: rule.title,
							titleKo: rule.titleKo,
							category,
							tier,
							explicitExecutor,
						})
					} else {
						if (TIER_RANK[tier] < TIER_RANK[prev.tier]) {
							prev.tier = tier // 더 엄격한 tier로 승격
						}
						prev.explicitExecutor ??= explicitExecutor
					}
				}
			}
		}
	}
	const ruleIdByKey = new Map<string, number>()
	for (const [key, { explicitExecutor, ...r }] of ruleByKey) {
		const executor = explicitExecutor ?? EXECUTOR_BY_TIER[r.tier]
		ruleIdByKey.set(key, await upsertRule(db, { key, ...r, executor }))
	}

	// 4) rule-bindings upsert ((page, rule) 자연키). 배치별 value/evidence.
	// rule-bindings 컬렉션은 20260706_014821에서 config에서 제거됐다 — fresh DB 재생이 깨지지 않도록
	// raw SQL로 쓴다 (이 시점엔 053851이 만든 rule_bindings 테이블이 존재한다).
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages as Page[]) {
				const pageId = pageIdByNumber.get(page.page)
				if (pageId === undefined) throw new Error(`page id 없음: ${page.page}`)
				for (const rule of page.rules as Rule[]) {
					const ruleId = ruleIdByKey.get(rule.key)
					if (ruleId === undefined) throw new Error(`rule id 없음: ${rule.key}`)
					await db.execute(sql`
						INSERT INTO rule_bindings (page_id, rule_id, value, evidence)
						SELECT ${pageId}, ${ruleId}, ${rule.value || null}, ${rule.evidence || null}
						WHERE NOT EXISTS (
							SELECT 1 FROM rule_bindings WHERE page_id = ${pageId} AND rule_id = ${ruleId}
						)`)
				}
			}
		}
	}
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	// 비파괴 원칙: 명백히 seed가 만든 것만 제거. rules/sections는 사전 존재 가능 → 남긴다.
	// rule-bindings 전체(이 마이그레이션 전용 테이블) + 'p-{n}' 페이지만 삭제.
	await db.execute(sql`DELETE FROM rule_bindings`)
	const pageSlugs = ruleset.chapters.flatMap((c) =>
		c.sections.flatMap((s) => (s.pages as Page[]).map((p) => pageSlug(p.page))),
	)
	for (const slug of pageSlugs) {
		await payload.delete({ collection: 'guideline-pages', where: { slug: { equals: slug } }, req })
	}
}
