import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { type CollectionSlug, getPayload } from 'payload'

// CI 섹션 콘텐츠 프로비저닝 (idempotent). 대상 DB에 실행: pnpm payload run scripts/seed-ci-section.ts
//  1) scripts/assets/ci 의 SVG를 brand-logos에 업로드(이름 기준 upsert)
//  2) 구조(brand-elements 챕터 > ci 섹션) upsert
//  3) CI 페이지 생성: 디자인컨셉(로고 크게)·국문/영문/HD형(클리어스페이스 뷰어+색상변형)·사용금지
// 스키마는 마이그레이션이, 콘텐츠는 이 시드가 옮긴다(CLAUDE.md Content Provisioning). 로컬·stage 어느 DB든 재실행 안전.
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 문서/블록 데이터를 느슨하게 다룬다.
type AnyData = any

const payload = await getPayload({ config })
const ASSETS = path.join(process.cwd(), 'scripts/assets/ci')

// ── 1) 에셋 업로드 (filename 기준 upsert, 존재하면 건너뜀) ──
// 🔑 중복검사는 filename으로. name은 사람이 admin에서 바꿀 수 있고 localized라 기준이 못 된다
// (실제로 옛 스크립트가 "HD현대 가로 기본형" 식으로 올린 로고를 name으로는 못 찾아 중복 업로드됐다).
async function uploadAsset(file: string): Promise<void> {
	const name = file.replace('.svg', '')
	const existing = await payload.find({
		collection: 'brand-logos',
		where: { filename: { equals: file } },
		limit: 1,
		overrideAccess: true,
	})
	if (existing.docs[0]) return
	const buffer = await readFile(path.join(ASSETS, file))
	await payload.create({
		collection: 'brand-logos',
		data: { name, alt: name, _status: 'published' },
		file: { data: buffer, mimetype: 'image/svg+xml', name: file, size: buffer.byteLength },
		overrideAccess: true,
	})
	console.log(`asset: ${name}`)
}
for (const f of (await readdir(ASSETS)).filter((f) => f.endsWith('.svg')).sort()) {
	await uploadAsset(f)
}

async function findId(collection: CollectionSlug, where: AnyData): Promise<number | null> {
	const { docs } = await payload.find({
		collection,
		where,
		limit: 1,
		depth: 0,
		overrideAccess: true,
	})
	return (docs[0]?.id as number) ?? null
}
async function logoId(filename: string): Promise<number> {
	const id = await findId('brand-logos', { filename: { equals: filename } })
	if (!id) throw new Error(`로고 없음: ${filename}`)
	return id
}

// ── 2) 구조: brand-elements 챕터 + ci 섹션 (slug+parent 스코프 upsert) ──
async function upsertDoc(opts: {
	slug: string
	title: string
	parentId: number | null
	order: number
}): Promise<number> {
	const where: AnyData =
		opts.parentId == null
			? { and: [{ slug: { equals: opts.slug } }, { parent: { exists: false } }] }
			: { and: [{ slug: { equals: opts.slug } }, { parent: { equals: opts.parentId } }] }
	const existing = await findId('guideline-documents', where)
	const data: AnyData = {
		title: opts.title,
		slug: opts.slug,
		generateSlug: false,
		_status: 'published',
		displayOrder: opts.order,
	}
	if (opts.parentId != null) data.parent = opts.parentId
	if (existing) {
		await payload.update({
			collection: 'guideline-documents',
			id: existing,
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			data,
		})
		return existing
	}
	const created = await payload.create({
		collection: 'guideline-documents',
		locale: 'ko',
		draft: false,
		overrideAccess: true,
		data,
	})
	return created.id as number
}

const brandElementsId = await upsertDoc({
	slug: 'brand-elements',
	title: 'Brand Elements',
	parentId: null,
	order: 3,
})
const ciId = await upsertDoc({ slug: 'ci', title: 'CI', parentId: brandElementsId, order: 0 })

// ── 3) CI 페이지 ──
function block(opts: { title: string; width: string; children: AnyData[] }): AnyData {
	return {
		blockType: 'block',
		title: opts.title,
		width: opts.width,
		arrangement: 'grid',
		columns: 1,
		aspectRatio: '1:1',
		children: opts.children,
	}
}
const colorVariant = (logo: number): AnyData => ({ blockType: 'logoColorVariantWidget', logo })
const logoDisplay = (logo: number): AnyData => ({ blockType: 'logoDisplayWidget', logo })
const clearspaceViewer = (cfg: AnyData): AnyData => ({
	blockType: 'clearspaceViewerWidget',
	...cfg,
})
const incorrectUsage = (): AnyData => ({ blockType: 'incorrectUsageWidget' })

async function upsertPage(opts: { slug: string; title: string; order: number; blocks: AnyData[] }) {
	const existing = await findId('guideline-documents', { slug: { equals: opts.slug } })
	const data: AnyData = {
		title: opts.title,
		slug: opts.slug,
		generateSlug: false,
		_status: 'published',
		displayOrder: opts.order,
		parent: ciId,
		blocks: opts.blocks,
	}
	if (existing)
		await payload.update({
			collection: 'guideline-documents',
			id: existing,
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			data,
		})
	else
		await payload.create({
			collection: 'guideline-documents',
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			data,
		})
	console.log(`page: ${opts.title} (${opts.slug})`)
}

const ko = await logoId('ko-horizontal-default.svg')
const en = await logoId('en-horizontal-default.svg')
const hd = await logoId('hd-horizontal-default.svg')

function langBlocks(colorLogo: number, viewer: AnyData): AnyData[] {
	return [
		block({ title: '로고', width: 'padded', children: [viewer] }),
		block({ title: '색상 변형', width: 'padded', children: [colorVariant(colorLogo)] }),
	]
}

await upsertPage({
	slug: 'ci-design-concept',
	title: '디자인 컨셉',
	order: 0,
	blocks: [block({ title: '디자인 컨셉', width: 'full', children: [logoDisplay(ko)] })],
})
await upsertPage({
	slug: 'ci-ko',
	title: '국문형',
	order: 1,
	blocks: langBlocks(
		ko,
		clearspaceViewer({
			horizontalLogo: await logoId('ko-horizontal-default-logoSpace.svg'),
			horizontalGrid: await logoId('ko-horizontal-default-clearSpace.svg'),
			horizontalMinHeightPx: 60,
			verticalLogo: await logoId('ko-vertical-default-logoSpace.svg'),
			verticalGrid: await logoId('ko-vertical-default-clearSpace.svg'),
			verticalMinHeightPx: 120,
		}),
	),
})
await upsertPage({
	slug: 'ci-en',
	title: '영문형',
	order: 2,
	blocks: langBlocks(
		en,
		clearspaceViewer({
			horizontalLogo: await logoId('en-horizontal-default-logoSpace.svg'),
			horizontalGrid: await logoId('en-horizontal-default-clearSpace.svg'),
			horizontalMinHeightPx: 60,
			verticalLogo: await logoId('en-vertical-default-logoSpace.svg'),
			verticalMinHeightPx: 120,
		}),
	),
})
await upsertPage({
	slug: 'ci-hd',
	title: 'HD형',
	order: 3,
	blocks: langBlocks(
		hd,
		clearspaceViewer({
			horizontalLogo: await logoId('hd-horizontal-default-logoSpace.svg'),
			horizontalGrid: await logoId('hd-horizontal-default-clearSpace.svg'),
			horizontalMinHeightPx: 60,
			verticalLogo: await logoId('hd-vertical-default-logoSpace.svg'),
			verticalGrid: await logoId('hd-vertical-default-clearSpace.svg'),
			verticalMinHeightPx: 120,
		}),
	),
})
await upsertPage({
	slug: 'ci-incorrect-usage',
	title: '사용 금지',
	order: 4,
	blocks: [block({ title: '사용 금지 규정', width: 'full', children: [incorrectUsage()] })],
})

console.log('✅ CI 섹션 프로비저닝 완료')
process.exit(0)
