import { readFileSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Rule TYPE 프리셋 카탈로그(121, 브랜드 무관)를 rules 컬렉션에 시드한다.
 * 데이터 출처: scripts/preset-catalog.json (brand-lint preset-catalog.md에서 추출, repo 자체 보관).
 * key 기준 upsert 라 반복 실행해도 중복이 생기지 않는다.
 * seed/migration 경계이므로 overrideAccess: true 사용 (docs/07 명시 예외).
 *
 * 주의: `payload run`은 모듈 동기 평가가 끝나면 프로세스를 종료하므로,
 * 작업을 함수로 감싸 호출만 하면 async가 끝나기 전에 죽는다 -> top-level await로 작성한다.
 */

type CatalogEntry = {
	key: string
	title: string
	category: string
	tier?: string
	executor?: string
	scopeOptions?: string[]
	frequency?: number
	domainDefault?: boolean
	paramSchema?: string
	scoring?: string
	input?: string
	note?: string
}

const payload = await getPayload({ config })

const file = path.resolve(process.cwd(), 'scripts/preset-catalog.json')
const entries = JSON.parse(readFileSync(file, 'utf-8')) as CatalogEntry[]

let created = 0
let updated = 0

for (const entry of entries) {
	const data = {
		key: entry.key,
		title: entry.title,
		category: entry.category,
		tier: entry.tier,
		executor: entry.executor,
		scope: entry.scopeOptions ?? [],
		frequency: entry.frequency,
		domainDefault: entry.domainDefault ?? false,
		paramSchema: entry.paramSchema,
		scoring: entry.scoring,
		input: entry.input,
		notes: entry.note,
		status: 'live',
	}

	const existing = await payload.find({
		collection: 'rules',
		where: { key: { equals: entry.key } },
		limit: 1,
		overrideAccess: true,
	})

	if (existing.docs.length > 0) {
		await payload.update({
			collection: 'rules',
			id: existing.docs[0].id,
			data,
			overrideAccess: true,
		})
		updated += 1
	} else {
		await payload.create({ collection: 'rules', data, overrideAccess: true })
		created += 1
	}
}

payload.logger.info(
	`Seed rules 완료: created=${created}, updated=${updated}, total=${entries.length}`,
)

process.exit(0)
