import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import type { GuidelineChecks, GuidelinePage } from '@/payload-types'

type Mode = 'dry-run' | 'draft' | 'publish'
type CheckSpec = {
	key: string
	title: string
	tier: 'required' | 'recommended'
	checkerKey: string
}
type ColumnSpec = { heading?: string; body?: string[]; image?: string }
type ColumnBlockSpec = {
	blockType: 'columnUnit'
	title: string
	columns: ColumnSpec[]
	checks?: CheckSpec[]
}
type DoDontBlockSpec = {
	blockType: 'doDont'
	title: string
	groups: {
		category: string
		examples: { kind: 'do' | 'dont'; image: string; caption: string }[]
	}[]
	checks?: CheckSpec[]
}
type BlockSpec = ColumnBlockSpec | DoDontBlockSpec
type PageSpec = {
	title: string
	slug: string
	displayOrder: number
	description: string[]
	blocks: BlockSpec[]
}
type AssetSpec = {
	filename: string
	sourcePage: number
	format: 'png' | 'svg'
	kind: string
	alt: string
	targets: string[]
}
type Manifest = {
	assets: AssetSpec[]
	chapter: { title: string; slug: string; description: string; displayOrder: number }
	section: { title: string; slug: string; description: string; displayOrder: number }
	pages: PageSpec[]
}
type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const assetDirectory = path.join(scriptDirectory, 'assets', 'essenherb-b3')
const manifest = JSON.parse(
	readFileSync(path.join(scriptDirectory, 'essenherb-b3.json'), 'utf8'),
) as Manifest

function selectedMode(): Mode {
	const flags = process.argv.slice(2).filter((argument) => argument.startsWith('--'))
	const modes = flags.filter((flag) => ['--dry-run', '--draft', '--publish'].includes(flag))
	assert.equal(flags.length, modes.length, `지원하지 않는 옵션: ${flags.join(', ')}`)
	assert.ok(modes.length <= 1, '실행 모드는 하나만 선택할 수 있습니다.')
	const environmentMode = process.env.B3_MODE
	assert.ok(
		environmentMode == null || ['dry-run', 'draft', 'publish'].includes(environmentMode),
		'B3_MODE는 dry-run, draft, publish 중 하나여야 합니다.',
	)
	assert.ok(
		!(environmentMode && modes.length),
		'B3_MODE와 CLI 실행 모드를 동시에 지정할 수 없습니다.',
	)
	return (
		(environmentMode as Mode | undefined) ??
		(modes[0]?.slice(2) as Mode | undefined) ??
		'dry-run'
	)
}

function referencedAssetNames(blocks: BlockSpec[]): string[] {
	return blocks.flatMap((block) =>
		block.blockType === 'columnUnit'
			? block.columns.flatMap((column) => (column.image ? [column.image] : []))
			: block.groups.flatMap((group) => group.examples.map((example) => example.image)),
	)
}

function expectedCheckKeys(page: PageSpec): string[] {
	return page.blocks.flatMap((block) => block.checks?.map((check) => check.key) ?? [])
}

function validateManifest(): void {
	assert.deepEqual(
		manifest.pages.map((page) => page.slug),
		['primary-typeface', 'micro-typography', 'typography-incorrect-usage', 'essen-flux'],
	)
	assert.equal(manifest.assets.length, 18)
	assert.equal(
		new Set(manifest.assets.map((asset) => asset.filename)).size,
		manifest.assets.length,
	)

	const pageSlugs = new Set(manifest.pages.map((page) => page.slug))
	const assetNames = new Set(manifest.assets.map((asset) => asset.filename))
	const references = manifest.pages.flatMap((page) => referencedAssetNames(page.blocks))
	assert.ok(
		manifest.assets.every((asset) => asset.targets.every((target) => pageSlugs.has(target))),
	)
	assert.ok(references.every((filename) => assetNames.has(filename)))
	assert.deepEqual([...new Set(references)].sort(), [...assetNames].sort())
	assert.deepEqual(manifest.pages.flatMap(expectedCheckKeys).sort(), [
		'typography.case',
		'typography.family',
		'typography.misuse',
		'typography.pairing',
		'typography.spacing',
		'typography.usage',
		'typography.weight',
	])

	const incorrectPage = manifest.pages.find((page) => page.slug === 'typography-incorrect-usage')
	const incorrectBlock = incorrectPage?.blocks[0]
	assert.equal(incorrectBlock?.blockType, 'doDont')
	if (incorrectBlock?.blockType === 'doDont') {
		assert.equal(incorrectBlock.groups.flatMap((group) => group.examples).length, 6)
		assert.ok(
			incorrectBlock.groups
				.flatMap((group) => group.examples)
				.every((example) => example.kind === 'dont'),
		)
	}

	const expectedFiles = manifest.assets.map((asset) => asset.filename).sort()
	assert.deepEqual(
		readdirSync(assetDirectory)
			.filter((name) => !name.startsWith('.'))
			.sort(),
		expectedFiles,
	)
	for (const asset of manifest.assets) {
		const filePath = path.join(assetDirectory, asset.filename)
		const file = readFileSync(filePath)
		assert.ok(
			file.length > 0 && file.length <= 10 * 1024 * 1024,
			`${asset.filename}: 파일 크기 오류`,
		)
		assert.equal(path.extname(asset.filename), `.${asset.format}`)
		assert.ok(
			!asset.filename.includes('page-'),
			`${asset.filename}: 전체 페이지 캡처는 허용하지 않습니다.`,
		)
		if (asset.format === 'png') {
			assert.ok(file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
		} else {
			const svg = file.toString('utf8')
			assert.match(svg, /<svg\b/)
			assert.doesNotMatch(svg, /<script\b|<foreignObject\b|javascript:/i)
			for (const [, reference] of svg.matchAll(/(?:href|xlink:href)="([^"]+)"/g)) {
				assert.ok(reference.startsWith('#') || reference.startsWith('data:'))
			}
		}
	}
}

function richText(paragraphs: string[]): NonNullable<GuidelinePage['description']> {
	return {
		root: {
			type: 'root',
			direction: 'ltr',
			format: '',
			indent: 0,
			version: 1,
			children: paragraphs.map((text) => ({
				type: 'paragraph',
				direction: 'ltr',
				format: '',
				indent: 0,
				version: 1,
				textFormat: 0,
				textStyle: '',
				children: [
					{
						type: 'text',
						version: 1,
						text,
						detail: 0,
						format: 0,
						mode: 'normal',
						style: '',
					},
				],
			})),
		},
	}
}

function existingChecks(page?: GuidelinePage): Map<string, NonNullable<GuidelineChecks>[number]> {
	const checks = new Map<string, NonNullable<GuidelineChecks>[number]>()
	for (const block of page?.blocks ?? []) {
		for (const check of block.checks ?? []) {
			assert.ok(!checks.has(check.key), `${page?.slug}: 중복 Check ${check.key}`)
			checks.set(check.key, check)
		}
	}
	return checks
}

function matchingBlock(spec: BlockSpec, blocks: GuidelineBlock[]): GuidelineBlock | undefined {
	const checkKeys = new Set(spec.checks?.map((check) => check.key) ?? [])
	return (
		blocks.find((block) => block.checks?.some((check) => checkKeys.has(check.key))) ??
		blocks.find((block) => block.blockType === spec.blockType && block.title === spec.title)
	)
}

function materializeChecks(
	specs: CheckSpec[] | undefined,
	preserved: Map<string, NonNullable<GuidelineChecks>[number]>,
	checkerIds: Map<string, number>,
): GuidelineChecks {
	return (
		specs?.map(
			(spec) =>
				preserved.get(spec.key) ?? {
					key: spec.key,
					title: spec.title,
					tier: spec.tier,
					checker: assertCheckerId(checkerIds, spec.checkerKey),
				},
		) ?? []
	)
}

function assertCheckerId(checkerIds: Map<string, number>, key: string): number {
	const id = checkerIds.get(key)
	assert.ok(id, `RuleChecker가 없습니다: ${key}`)
	return id
}

function materializeBlocks(
	page: PageSpec,
	assetIds: Map<string, number>,
	checkerIds: Map<string, number>,
	existingPage?: GuidelinePage,
): NonNullable<GuidelinePage['blocks']> {
	const preservedChecks = existingChecks(existingPage)
	const expected = new Set(expectedCheckKeys(page))
	for (const key of preservedChecks.keys())
		assert.ok(expected.has(key), `${page.slug}: 예상하지 못한 Check ${key}`)

	return page.blocks.map((spec) => {
		const existing = matchingBlock(spec, existingPage?.blocks ?? [])
		const common = {
			id: existing?.id,
			title: spec.title,
			checks: materializeChecks(spec.checks, preservedChecks, checkerIds),
		}
		if (spec.blockType === 'columnUnit') {
			return {
				...common,
				blockType: 'columnUnit' as const,
				columns: spec.columns.map((column) => ({
					heading: column.heading,
					body: column.body ? richText(column.body) : undefined,
					image: column.image ? assertAssetId(assetIds, column.image) : undefined,
					imageScale: '100' as const,
				})),
			}
		}
		return {
			...common,
			blockType: 'doDont' as const,
			groups: spec.groups.map((group) => ({
				category: group.category,
				examples: group.examples.map((example) => ({
					...example,
					image: assertAssetId(assetIds, example.image),
				})),
			})),
		}
	})
}

function assertAssetId(assetIds: Map<string, number>, filename: string): number {
	const id = assetIds.get(filename)
	assert.ok(id, `Application Image가 없습니다: ${filename}`)
	return id
}

async function findPage(
	payload: Payload,
	slug: string,
	draft: boolean,
): Promise<GuidelinePage | undefined> {
	const result = await payload.find({
		collection: 'guideline-pages',
		where: { slug: { equals: slug } },
		depth: 0,
		draft,
		fallbackLocale: false,
		locale: 'ko',
		limit: 2,
		overrideAccess: true,
	})
	assert.ok(result.docs.length <= 1, `중복 Guideline Page slug: ${slug}`)
	return result.docs[0]
}

async function checkerIds(payload: Payload): Promise<Map<string, number>> {
	const keys = [...new Set(manifest.pages.flatMap(expectedCheckKeys))]
	const checkerKeys = [
		...new Set(
			manifest.pages.flatMap((page) =>
				page.blocks.flatMap(
					(block) => block.checks?.map((check) => check.checkerKey) ?? [],
				),
			),
		),
	]
	assert.equal(keys.length, 7)
	const result = await payload.find({
		collection: 'rule-checkers',
		where: { key: { in: checkerKeys } },
		depth: 0,
		draft: false,
		limit: checkerKeys.length,
		overrideAccess: true,
	})
	const ids = new Map(result.docs.map((checker) => [checker.key, checker.id]))
	for (const key of checkerKeys) assertCheckerId(ids, key)
	return ids
}

async function draftAssets(payload: Payload): Promise<Map<string, number>> {
	const ids = new Map<string, number>()
	for (const asset of manifest.assets) {
		const result = await payload.find({
			collection: 'application-images',
			where: { filename: { equals: asset.filename } },
			depth: 0,
			draft: true,
			fallbackLocale: false,
			locale: 'ko',
			limit: 2,
			overrideAccess: true,
		})
		assert.ok(result.docs.length <= 1, `중복 Application Image filename: ${asset.filename}`)
		const existing = result.docs[0]
		if (existing) {
			if (existing.filesize != null) {
				assert.equal(
					existing.filesize,
					statSync(path.join(assetDirectory, asset.filename)).size,
				)
			}
			await payload.update({
				collection: 'application-images',
				id: existing.id,
				data: { name: path.parse(asset.filename).name, alt: asset.alt } as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
			ids.set(asset.filename, existing.id)
			continue
		}
		const created = await payload.create({
			collection: 'application-images',
			data: { name: path.parse(asset.filename).name, alt: asset.alt } as never,
			filePath: path.join(assetDirectory, asset.filename),
			draft: true,
			fallbackLocale: false,
			locale: 'ko',
			overrideAccess: true,
		})
		ids.set(asset.filename, created.id)
	}
	return ids
}

async function draftHierarchy(payload: Payload): Promise<{ chapterId: number; sectionId: number }> {
	const chapters = await payload.find({
		collection: 'guideline-chapters',
		where: { slug: { equals: manifest.chapter.slug } },
		depth: 0,
		draft: true,
		fallbackLocale: false,
		locale: 'ko',
		limit: 2,
		overrideAccess: true,
	})
	assert.ok(chapters.docs.length <= 1, `중복 Guideline Chapter slug: ${manifest.chapter.slug}`)
	const chapter = chapters.docs[0]
		? await payload.update({
				collection: 'guideline-chapters',
				id: chapters.docs[0].id,
				data: manifest.chapter as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
		: await payload.create({
				collection: 'guideline-chapters',
				data: manifest.chapter as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})

	const sections = await payload.find({
		collection: 'guideline-sections',
		where: { slug: { equals: manifest.section.slug } },
		depth: 0,
		draft: true,
		fallbackLocale: false,
		locale: 'ko',
		limit: 2,
		overrideAccess: true,
	})
	assert.ok(sections.docs.length <= 1, `중복 Guideline Section slug: ${manifest.section.slug}`)
	const sectionData = { ...manifest.section, chapter: chapter.id }
	const section = sections.docs[0]
		? await payload.update({
				collection: 'guideline-sections',
				id: sections.docs[0].id,
				data: sectionData as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
		: await payload.create({
				collection: 'guideline-sections',
				data: sectionData as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
	return { chapterId: chapter.id, sectionId: section.id }
}

async function writeDraft(payload: Payload): Promise<void> {
	const assets = await draftAssets(payload)
	const checkers = await checkerIds(payload)
	const { sectionId } = await draftHierarchy(payload)
	for (const pageSpec of manifest.pages) {
		const existing = await findPage(payload, pageSpec.slug, true)
		const data = {
			title: pageSpec.title,
			slug: pageSpec.slug,
			description: richText(pageSpec.description),
			section: sectionId,
			displayOrder: pageSpec.displayOrder,
			blocks: materializeBlocks(pageSpec, assets, checkers, existing),
		}
		if (existing) {
			await payload.update({
				collection: 'guideline-pages',
				id: existing.id,
				data: data as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
		} else {
			await payload.create({
				collection: 'guideline-pages',
				data: data as never,
				draft: true,
				fallbackLocale: false,
				locale: 'ko',
				overrideAccess: true,
			})
		}
	}
	await verifyPages(payload, assets, true)
}

function blockAssetIds(blocks: GuidelineBlock[]): number[] {
	return blocks.flatMap((block) => {
		if (block.blockType === 'columnUnit') {
			return (
				block.columns?.flatMap((column) =>
					typeof column.image === 'number' ? [column.image] : [],
				) ?? []
			)
		}
		if (block.blockType === 'doDont') {
			return (
				block.groups?.flatMap(
					(group) =>
						group.examples?.flatMap((example) =>
							typeof example.image === 'number' ? [example.image] : [],
						) ?? [],
				) ?? []
			)
		}
		return []
	})
}

async function verifyPages(
	payload: Payload,
	assets: Map<string, number>,
	draft: boolean,
): Promise<void> {
	for (const pageSpec of manifest.pages) {
		const page = await findPage(payload, pageSpec.slug, draft)
		assert.ok(page, `Guideline Page가 없습니다: ${pageSpec.slug}`)
		assert.equal(page.blocks?.length, pageSpec.blocks.length)
		assert.deepEqual(
			[...existingChecks(page).keys()].sort(),
			expectedCheckKeys(pageSpec).sort(),
		)
		assert.deepEqual(
			[...new Set(blockAssetIds(page.blocks ?? []))].sort((a, b) => a - b),
			[
				...new Set(
					referencedAssetNames(pageSpec.blocks).map((name) =>
						assertAssetId(assets, name),
					),
				),
			].sort((a, b) => a - b),
		)
	}
}

async function publishDraft(payload: Payload): Promise<void> {
	const assets = new Map<string, number>()
	for (const asset of manifest.assets) {
		const result = await payload.find({
			collection: 'application-images',
			where: { filename: { equals: asset.filename } },
			depth: 0,
			draft: true,
			limit: 2,
			overrideAccess: true,
		})
		assert.equal(
			result.docs.length,
			1,
			`발행할 Application Image가 없습니다: ${asset.filename}`,
		)
		assets.set(asset.filename, result.docs[0].id)
	}
	await verifyPages(payload, assets, true)

	for (const id of assets.values()) {
		await payload.update({
			collection: 'application-images',
			id,
			data: { _status: 'published' } as never,
			draft: false,
			overrideAccess: true,
		})
	}
	for (const collection of ['guideline-chapters', 'guideline-sections'] as const) {
		const slug =
			collection === 'guideline-chapters' ? manifest.chapter.slug : manifest.section.slug
		const result = await payload.find({
			collection,
			where: { slug: { equals: slug } },
			depth: 0,
			draft: true,
			limit: 2,
			overrideAccess: true,
		})
		assert.equal(result.docs.length, 1, `발행할 문서가 없습니다: ${slug}`)
		await payload.update({
			collection,
			id: result.docs[0].id,
			data: { _status: 'published' } as never,
			draft: false,
			overrideAccess: true,
		})
	}
	for (const pageSpec of manifest.pages) {
		const page = await findPage(payload, pageSpec.slug, true)
		assert.ok(page)
		await payload.update({
			collection: 'guideline-pages',
			id: page.id,
			data: { _status: 'published' } as never,
			draft: false,
			overrideAccess: true,
		})
	}
	await verifyPages(payload, assets, false)
}

function assertEnvironment(): void {
	for (const key of [
		'DATABASE_URL',
		'PAYLOAD_SECRET',
		'S3_ACCESS_KEY_ID',
		'S3_BUCKET',
		'S3_REGION',
		'S3_SECRET_ACCESS_KEY',
	]) {
		assert.ok(process.env[key], `환경 변수가 없습니다: ${key}`)
	}
}

const mode = selectedMode()
validateManifest()
if (mode === 'dry-run') {
	process.stdout.write(
		`B.3 검증 완료: ${manifest.assets.length} assets, ${manifest.pages.length} pages\n`,
	)
	process.exit(0)
}

assertEnvironment()
const [{ default: config }, { getPayload }] = await Promise.all([
	import('@payload-config'),
	import('payload'),
])
const payload = await getPayload({ config })

// 신뢰된 관리성 batch만 access를 우회하며, 사용자 요청 경로에서는 이 importer를 호출하지 않는다.
if (mode === 'draft') await writeDraft(payload)
else await publishDraft(payload)

payload.logger.info(`essenherb-b3.${mode}.completed`)
process.exit(0)
