import { readFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { type AnyData, assertExported, makeFromPortable } from './lib/guideline-content'

// JSON 정본의 가이드라인 문서·블록을 대상 DB에 적용한다(코드 → DB, idempotent).
//   pnpm payload run scripts/seed-guideline-content.ts            # 정본 전체
//   pnpm payload run scripts/seed-guideline-content.ts layout     # 특정 slug만
//
// 🔴 쓰기 전에 assertExported가 DB와 정본의 최신성을 비교한다. export하지 않은 admin 편집이
//    있으면 멈춘다. 의도적으로 덮어쓸 때만 FORCE=true.
// 문서 자체(제목·부모·순서)가 없으면 만들지 않고 건너뛴다 — 구조는 별도 시드가 소유한다.

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))

const payload = await getPayload({ config })
const fromPortable = makeFromPortable(payload)

const content: AnyData = JSON.parse(await readFile(CONTENT_PATH, 'utf8'))
const targets: AnyData[] = content.documents.filter(
	(doc: AnyData) => only.length === 0 || only.includes(doc.slug),
)
if (targets.length === 0) throw new Error(`정본에 대상 문서 없음: ${only.join(', ') || '(전체)'}`)

await assertExported(
	payload,
	CONTENT_PATH,
	targets.map((doc) => doc.slug),
)

let applied = 0
for (const doc of targets) {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		where: { slug: { equals: doc.slug } },
		limit: 1,
		locale: 'ko',
		draft: false,
		depth: 0,
		overrideAccess: true,
	})
	const existing = docs[0]
	if (!existing) {
		console.warn(`⚠️  문서 없음(건너뜀): ${doc.slug}`)
		continue
	}

	await payload.update({
		collection: 'guideline-documents',
		id: existing.id,
		locale: 'ko',
		draft: false,
		overrideAccess: true,
		data: { _status: 'published', blocks: await fromPortable(doc.blocks) },
	})
	applied += 1
	console.log(`  ${doc.slug}: 블록 ${doc.blocks.length}개 적용`)
}

console.log(`✅ seed 완료 — 문서 ${applied}개`)
process.exit(0)
