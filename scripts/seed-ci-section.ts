import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { type CollectionSlug, getPayload } from 'payload'

// CI 섹션 콘텐츠 프로비저닝 (idempotent). 대상 DB에 실행: pnpm payload run scripts/seed-ci-section.ts
//  1) scripts/assets/{ci,do-dont} 의 에셋 업로드(filename 기준 upsert)
//  2) 구조(brand-elements 챕터 > ci 섹션) upsert
//  3) scripts/data/ci-section.json 의 페이지·블록을 그대로 적용
//
// 🔑 콘텐츠 값은 이 파일이 아니라 JSON이 정본이다. admin에서 편집한 뒤
//    `pnpm payload run scripts/export-ci-section.ts`로 JSON을 갱신하고 커밋한다(DB → 코드).
//    그래야 이 시드를 다시 돌려도 admin 수정이 덮이지 않는다.
// 스키마는 마이그레이션이, 콘텐츠는 이 시드가 옮긴다(CLAUDE.md Content Provisioning).
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 문서/블록 데이터를 느슨하게 다룬다.
type AnyData = any

const payload = await getPayload({ config })
const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/ci-section.json')
const CI_ASSETS = path.join(process.cwd(), 'scripts/assets/ci')
const DO_DONT_ASSETS = path.join(process.cwd(), 'scripts/assets/do-dont')

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

// ── 1) 에셋 업로드 ──
// 🔑 중복검사는 filename으로. name은 사람이 admin에서 바꿀 수 있고 localized라 기준이 못 된다.
// 🔴 파일 내용만 갱신할 때 payload.update(file)을 쓰면 안 된다 — Payload가 파일명을 재부여해서
//    ci-incorrect-01.webp가 ci-incorrect-2.webp로 바뀌고, 다음 실행에서 못 찾아 중복이 생긴다.
//    이미지를 교체하려면 해당 레코드를 먼저 삭제하고 이 시드를 다시 실행한다.
async function uploadAsset(
	collection: 'brand-logos' | 'application-images',
	dir: string,
	file: string,
	mimetype: string,
): Promise<void> {
	if (await findId(collection, { filename: { equals: file } })) return
	const name = file.replace(path.extname(file), '')
	const buffer = await readFile(path.join(dir, file))
	await payload.create({
		collection,
		data: { name, alt: name, _status: 'published' },
		file: { data: buffer, mimetype, name: file, size: buffer.byteLength },
		overrideAccess: true,
	})
	console.log(`asset: ${name}`)
}

for (const f of (await readdir(CI_ASSETS)).filter((f) => f.endsWith('.svg')).sort()) {
	await uploadAsset('brand-logos', CI_ASSETS, f, 'image/svg+xml')
}
for (const f of (await readdir(DO_DONT_ASSETS)).filter((f) => f.endsWith('.webp')).sort()) {
	await uploadAsset('application-images', DO_DONT_ASSETS, f, 'image/webp')
}

// ── 2) 이식 키(file/color)를 이 DB의 id로 되돌린다 (export의 역변환) ──
// 업로드는 어느 컬렉션에 있는지 모르므로 후보를 순서대로 조회한다.
const UPLOAD_COLLECTIONS: CollectionSlug[] = ['brand-logos', 'application-images']

async function resolveFile(filename: string): Promise<number> {
	for (const collection of UPLOAD_COLLECTIONS) {
		const id = await findId(collection, { filename: { equals: filename } })
		if (id) return id
	}
	throw new Error(`에셋 없음: ${filename}`)
}
// brand-colors는 이 시드가 만들지 않는 별도 관리 대상(브랜드 팔레트)이다.
// 없으면 배경색만 생략하고 나머지 콘텐츠는 그대로 적용한다 — 색 하나 때문에 전체가 죽지 않게.
async function resolveColor(hex: string): Promise<number | null> {
	const id = await findId('brand-colors', { hex: { equals: hex } })
	if (!id) console.warn(`⚠️  brand-colors 없음(배경색 생략): ${hex}`)
	return id
}

async function fromPortable(value: AnyData): Promise<AnyData> {
	if (Array.isArray(value)) {
		const out = []
		for (const v of value) out.push(await fromPortable(v))
		return out
	}
	if (value && typeof value === 'object') {
		if (typeof value.file === 'string') return await resolveFile(value.file)
		if (typeof value.color === 'string') return await resolveColor(value.color)
		const out: AnyData = {}
		for (const [key, v] of Object.entries(value)) out[key] = await fromPortable(v)
		return out
	}
	return value
}

// ── 3) 구조 + 페이지 upsert ──
async function upsertDoc(opts: {
	slug: string
	title: string
	parentId: number | null
	order: number
	blocks?: AnyData[]
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
	if (opts.blocks) data.blocks = opts.blocks
	const args = {
		collection: 'guideline-documents' as const,
		locale: 'ko' as const,
		draft: false,
		overrideAccess: true,
	}
	if (existing) {
		await payload.update({ ...args, id: existing, data })
		return existing
	}
	const created = await payload.create({ ...args, data })
	return created.id as number
}

const content = JSON.parse(await readFile(CONTENT_PATH, 'utf8'))

const chapterId = await upsertDoc({
	slug: content.chapter.slug,
	title: content.chapter.title,
	parentId: null,
	order: content.chapter.order,
})
const sectionId = await upsertDoc({
	slug: content.section.slug,
	title: content.section.title,
	parentId: chapterId,
	order: content.section.order,
})

for (const page of content.pages) {
	await upsertDoc({
		slug: page.slug,
		title: page.title,
		parentId: sectionId,
		order: page.order,
		blocks: await fromPortable(page.blocks),
	})
	console.log(`page: ${page.title} (${page.slug})`)
}

console.log('✅ CI 섹션 프로비저닝 완료')
process.exit(0)
