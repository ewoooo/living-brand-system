import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import ruleset from './data/essenherb-ruleset.json'

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

interface PlacementRow {
	placement_id: string
	page_id: number
	page_slug: string
	placement_order: number
	rule_id: number
	key: string
	title: string
	title_ko: string | null
	category: RuleCategory
	tier: 'A' | 'B' | 'C' | null
	executor: 'deterministic' | 'heuristic' | 'advisory' | null
	param_schema: string | null
	scoring: string | null
	input: string | null
	notes: string | null
	rule_value: string | null
	rule_evidence: string | null
	placement_value: string | null
	placement_evidence: string | null
}

interface PlacementAssetRow {
	page_id: number
	placement_order: number
	application_images_id: number
}

const SIMPLE_RENAMES: Record<string, string> = {
	'logo.min-size': 'logo.size.minimum',
	'logo.clear-space': 'logo.space.clear',
	'logo.clear-space.construction': 'logo.space.construction',
	'color.pairing.example-matrix': 'color.combination.examples',
	'typography.families': 'typography.family',
	'typography.weights': 'typography.weight',
	'typography.case-policy': 'typography.case',
}

const PAGE_KEY_RENAMES: Record<string, Record<string, string>> = {
	name: { 'messaging.statement': 'messaging.name.statement' },
	narrative: { 'messaging.statement': 'messaging.narrative.statement' },
	'brand-logo': {
		'color.misuse': 'logo.color.misuse',
		'color.contrast.photo-bg': 'logo.background.legibility',
		'logo.variants': 'logo.variant',
	},
	'color-system': {
		'color.misuse': 'color.misuse',
		'logo.color.misuse': 'color.misuse',
		'color.pairing': 'color.combination',
		'color.print-fidelity': 'color.print.fidelity',
	},
	illustration: {
		'color.pairing': 'illustration.color.combination',
		'color.combination': 'illustration.color.combination',
		'color.usage': 'illustration.color.usage',
	},
	photography: { 'imagery.classification': 'imagery.photography.classification' },
	'visual-system': {
		'application.sns': 'application.sns.canvas-format',
		'application.sns.format': 'application.sns.canvas-format',
		'messaging.tagline': 'messaging.visual.tagline',
		'messaging.boilerplate': 'messaging.visual.boilerplate',
		'layout.template': 'layout.visual.template',
		'grid.system': 'grid.visual.system',
	},
	'sns-contents': {
		'application.sns': 'application.sns.format',
		'imagery.classification': 'imagery.sns.classification',
		'layout.zones': 'layout.sns.zones',
		'layout.template': 'layout.sns.template',
		'layout.tone': 'layout.sns.tone',
		'color.contrast.photo-bg': 'application.sns.caption.legibility',
		'logo.placement': 'logo.sns.placement',
		'messaging.application-copy': 'messaging.sns.copy',
	},
	ad: {
		'application.format': 'application.advertisement.format',
		'layout.template': 'layout.advertisement.template',
		'layout.zones': 'layout.advertisement.zones',
		'spacing.scale': 'spacing.advertisement.scale',
		'messaging.tagline': 'messaging.advertisement.tagline',
		'messaging.boilerplate': 'messaging.advertisement.boilerplate',
		'messaging.application-copy': 'messaging.advertisement.copy',
		'imagery.classification': 'imagery.advertisement.classification',
	},
	stationery: {
		'application.format': 'application.stationery.format',
		'application.spec-scale': 'application.stationery.spec.scale',
		'layout.zones': 'layout.stationery.zones',
		'grid.system': 'grid.stationery.system',
		'layout.tone': 'layout.stationery.tone',
		'color.print-fidelity': 'application.stationery.spot.color',
		'messaging.content-fields': 'messaging.stationery.content.fields',
		'messaging.contact-block': 'messaging.stationery.contact',
		'messaging.boilerplate': 'messaging.stationery.boilerplate',
		'messaging.application-copy': 'messaging.stationery.copy',
		'imagery.classification': 'imagery.stationery.classification',
	},
	package: {
		'application.format': 'application.package.format',
		'application.spec-scale': 'application.package.spec.scale',
		'grid.system': 'grid.package.system',
		'layout.zones': 'layout.package.zones',
		'spacing.scale': 'spacing.package.scale',
		'logo.placement': 'logo.package.placement',
		'logo.variants': 'logo.package.variant',
		'layout.tone': 'layout.package.tone',
		'color.print-fidelity': 'application.package.print.fidelity',
		'messaging.content-fields': 'messaging.package.content.fields',
		'messaging.contact-block': 'messaging.package.contact',
	},
}

const ARCHIVE_KEYS = [
	'application.format',
	'application.spec-scale',
	'application.sns',
	'color.contrast.photo-bg',
	'color.pairing',
	'color.print-fidelity',
	'grid.system',
	'imagery.classification',
	'layout.template',
	'layout.tone',
	'layout.zones',
	'logo.placement',
	'logo.variants',
	'messaging.application-copy',
	'messaging.boilerplate',
	'messaging.contact-block',
	'messaging.content-fields',
	'messaging.statement',
	'messaging.tagline',
	'spacing.scale',
]

const CATEGORIES = new Set<RuleCategory>([
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

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await ensureRuleCriteriaSchema(db)
	const hasPlacementValue = await hasColumn(db, 'guideline_pages_rules', 'value')
	const hasPlacementEvidence = await hasColumn(db, 'guideline_pages_rules', 'evidence')
	const placementValueSelect = hasPlacementValue
		? sql`gpr.value AS placement_value`
		: sql`NULL::varchar AS placement_value`
	const placementEvidenceSelect = hasPlacementEvidence
		? sql`gpr.evidence AS placement_evidence`
		: sql`NULL::varchar AS placement_evidence`

	const placements = (await db.execute(sql`
		SELECT
			gpr.id AS placement_id,
			gpr._parent_id AS page_id,
			gpl.slug AS page_slug,
			gpr._order AS placement_order,
			gpr.rule_id,
			r.key,
			r.title,
			r.title_ko,
			r.category::text AS category,
			r.tier::text AS tier,
			r.executor::text AS executor,
			r.param_schema,
			r.scoring,
			r.input,
			r.notes,
			r.value AS rule_value,
			r.evidence AS rule_evidence,
			${placementValueSelect},
			${placementEvidenceSelect}
		FROM guideline_pages_rules gpr
		JOIN rules r ON r.id = gpr.rule_id
		JOIN guideline_pages_locales gpl ON gpl._parent_id = gpr._parent_id AND gpl._locale = 'ko'
		ORDER BY gpr._parent_id, gpr._order
	`)).rows as unknown as PlacementRow[]

	const placementAssets = (await db.execute(sql`
		SELECT
			gpr._parent_id AS page_id,
			gpr._order AS placement_order,
			gprr.application_images_id
		FROM guideline_pages_rules gpr
		JOIN guideline_pages_rels gprr
			ON gprr.parent_id = gpr._parent_id
			AND gprr.path = 'rules.' || gpr._order || '.referenceAssets'
			AND gprr.application_images_id IS NOT NULL
		ORDER BY gpr._parent_id, gpr._order, gprr."order"
	`)).rows as unknown as PlacementAssetRow[]

	const assetsByPlacement = new Map<string, number[]>()
	for (const asset of placementAssets) {
		const key = `${asset.page_id}:${asset.placement_order}`
		const list = assetsByPlacement.get(key) ?? []
		list.push(asset.application_images_id)
		assetsByPlacement.set(key, list)
	}

	const seedCriteria = getSeedCriteria()
	const criteriaByRuleId = new Map<
		number,
		{ key: string; value?: string; evidence?: string; assets: Set<number> }
	>()

	for (const row of placements) {
		const nextKey = PAGE_KEY_RENAMES[row.page_slug]?.[row.key] ?? SIMPLE_RENAMES[row.key] ?? row.key
		const targetRuleId = await ensureRule(payload, req, row, nextKey)
		if (targetRuleId !== row.rule_id) {
			await db.execute(sql`
				UPDATE guideline_pages_rules SET rule_id = ${targetRuleId} WHERE id = ${row.placement_id}
			`)
		}
		const seed = seedCriteria.get(nextKey)
		const criteria = criteriaByRuleId.get(targetRuleId) ?? { key: nextKey, assets: new Set<number>() }
		criteria.value = clean(row.placement_value) ?? clean(seed?.value) ?? criteria.value ?? clean(row.rule_value)
		criteria.evidence =
			clean(row.placement_evidence) ?? clean(seed?.evidence) ?? criteria.evidence ?? clean(row.rule_evidence)
		const assets = assetsByPlacement.get(`${row.page_id}:${row.placement_order}`) ?? []
		for (const assetId of assets) criteria.assets.add(assetId)
		criteriaByRuleId.set(targetRuleId, criteria)
	}

	for (const [id, criteria] of criteriaByRuleId) {
		await payload.update({
			collection: 'rules',
			id,
			data: {
				value: criteria.value,
				evidence: criteria.evidence,
				referenceAssets: [...criteria.assets],
			},
			req,
		})
	}

	for (const key of ARCHIVE_KEYS) {
		await db.execute(sql`UPDATE rules SET status = 'archived' WHERE key = ${key}`)
	}

	await attachTypographyReferenceAssets(payload, req)

	await db.execute(sql`
		DELETE FROM guideline_pages_rels WHERE path LIKE 'rules.%.referenceAssets';
		DELETE FROM _guideline_pages_v_rels WHERE path LIKE 'rules.%.referenceAssets';
		ALTER TABLE guideline_pages_rules DROP COLUMN IF EXISTS value;
		ALTER TABLE guideline_pages_rules DROP COLUMN IF EXISTS evidence;
		ALTER TABLE guideline_pages_rules DROP COLUMN IF EXISTS source_page;
		ALTER TABLE _guideline_pages_v_version_rules DROP COLUMN IF EXISTS value;
		ALTER TABLE _guideline_pages_v_version_rules DROP COLUMN IF EXISTS evidence;
		ALTER TABLE _guideline_pages_v_version_rules DROP COLUMN IF EXISTS source_page;
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE guideline_pages_rules ADD COLUMN IF NOT EXISTS value varchar;
		ALTER TABLE guideline_pages_rules ADD COLUMN IF NOT EXISTS evidence varchar;
		ALTER TABLE _guideline_pages_v_version_rules ADD COLUMN IF NOT EXISTS value varchar;
		ALTER TABLE _guideline_pages_v_version_rules ADD COLUMN IF NOT EXISTS evidence varchar;
	`)
}

async function ensureRuleCriteriaSchema(db: MigrateUpArgs['db']) {
	await db.execute(sql`
		ALTER TABLE rules ADD COLUMN IF NOT EXISTS value varchar;
		ALTER TABLE rules ADD COLUMN IF NOT EXISTS evidence varchar;
		CREATE TABLE IF NOT EXISTS rules_rels (
			id serial PRIMARY KEY,
			"order" integer,
			parent_id integer NOT NULL,
			path varchar NOT NULL,
			application_images_id integer
		);
		CREATE INDEX IF NOT EXISTS rules_rels_order_idx ON rules_rels USING btree ("order");
		CREATE INDEX IF NOT EXISTS rules_rels_parent_idx ON rules_rels USING btree (parent_id);
		CREATE INDEX IF NOT EXISTS rules_rels_path_idx ON rules_rels USING btree (path);
		CREATE INDEX IF NOT EXISTS rules_rels_application_images_id_idx ON rules_rels USING btree (application_images_id);
		DO $$ BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'rules_rels_parent_fk'
			) THEN
				ALTER TABLE rules_rels
				ADD CONSTRAINT rules_rels_parent_fk
				FOREIGN KEY (parent_id) REFERENCES public.rules(id)
				ON DELETE cascade ON UPDATE no action;
			END IF;
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'rules_rels_application_images_fk'
			) THEN
				ALTER TABLE rules_rels
				ADD CONSTRAINT rules_rels_application_images_fk
				FOREIGN KEY (application_images_id) REFERENCES public.application_images(id)
				ON DELETE cascade ON UPDATE no action;
			END IF;
		END $$;
	`)
}

async function hasColumn(db: MigrateUpArgs['db'], tableName: string, columnName: string) {
	const result = await db.execute(sql`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = 'public'
				AND table_name = ${tableName}
				AND column_name = ${columnName}
		) AS exists
	`)
	return Boolean((result.rows?.[0] as { exists?: boolean } | undefined)?.exists)
}

async function ensureRule(
	payload: MigrateUpArgs['payload'],
	req: MigrateUpArgs['req'],
	row: PlacementRow,
	key: string,
) {
	if (key === row.key) return row.rule_id

	const existing = await payload.find({
		collection: 'rules',
		where: { key: { equals: key } },
		limit: 1,
		depth: 0,
		req,
	})
	if (existing.docs[0]) {
		const updated = await payload.update({
			collection: 'rules',
			id: existing.docs[0].id,
			data: { ...ruleDataFrom(row, key), status: 'live' },
			req,
		})
		return updated.id as number
	}

	if (SIMPLE_RENAMES[row.key] === key) {
		const updated = await payload.update({
			collection: 'rules',
			id: row.rule_id,
			data: ruleDataFrom(row, key),
			req,
		})
		return updated.id as number
	}

	const created = await payload.create({
		collection: 'rules',
		data: {
			...ruleDataFrom(row, key),
			status: 'live',
		},
		req,
	})
	return created.id as number
}

function ruleDataFrom(row: PlacementRow, key: string) {
	return {
		key,
		title: row.title,
		titleKo: row.title_ko ?? row.title,
		category: categoryFromKey(key),
		tier: row.tier ?? 'C',
		executor: row.executor ?? 'advisory',
		paramSchema: row.param_schema,
		scoring: row.scoring,
		input: row.input,
		notes: row.notes,
	}
}

function categoryFromKey(key: string): RuleCategory {
	const first = key.split('.')[0] as RuleCategory
	return CATEGORIES.has(first) ? first : 'misc'
}

function clean(value: string | null | undefined) {
	const trimmed = value?.trim()
	return trimmed || undefined
}

function getSeedCriteria() {
	const criteria = new Map<string, { value?: string; evidence?: string }>()
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages) {
				for (const rule of page.rules ?? []) {
					if (!criteria.has(rule.key)) {
						criteria.set(rule.key, { value: rule.value, evidence: rule.evidence })
					}
				}
			}
		}
	}
	return criteria
}

async function attachTypographyReferenceAssets(
	payload: MigrateUpArgs['payload'],
	req: MigrateUpArgs['req'],
) {
	const assets = await payload.find({
		collection: 'application-images',
		where: {
			or: [
				{ name: { equals: 'Essen Flux structural sample' } },
				{ name: { equals: 'Essen Flux glyph set' } },
				{ name: { equals: 'Essen Flux usage and casing examples' } },
			],
		},
		limit: 10,
		depth: 0,
		req,
	})
	const byName = new Map(assets.docs.map((asset) => [asset.name, asset.id as number]))
	const ids = {
		structure: byName.get('Essen Flux structural sample'),
		glyphs: byName.get('Essen Flux glyph set'),
		usage: byName.get('Essen Flux usage and casing examples'),
	}
	const byRule: Record<string, (number | undefined)[]> = {
		'typography.family': [ids.structure, ids.glyphs],
		'typography.weight': [ids.glyphs],
		'typography.spacing': [ids.structure, ids.usage],
		'typography.pairing': [ids.usage],
		'typography.misuse': [ids.usage],
		'typography.usage': [ids.usage],
		'typography.case': [ids.usage],
	}

	for (const [key, values] of Object.entries(byRule)) {
		const referenceAssets = values.filter((value): value is number => typeof value === 'number')
		if (referenceAssets.length === 0) continue
		const found = await payload.find({
			collection: 'rules',
			where: { key: { equals: key } },
			limit: 1,
			depth: 0,
			req,
		})
		const rule = found.docs[0]
		if (!rule) continue
		await payload.update({
			collection: 'rules',
			id: rule.id,
			data: { referenceAssets },
			req,
		})
	}
}
