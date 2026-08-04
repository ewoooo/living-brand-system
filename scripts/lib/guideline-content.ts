import { stat } from 'node:fs/promises'
import path from 'node:path'
import type { BasePayload, CollectionSlug } from 'payload'

// 가이드라인 콘텐츠(문서·블록)를 코드와 DB 사이에서 옮기는 공용 규약.
//   admin 편집 → export(DB → JSON 정본) → 커밋 → 다른 환경에 seed(JSON → DB)
//
// 🔴 이 파일의 assertExported가 유일한 방어선이다. 콘텐츠를 쓰는 시드는 전부 이걸 먼저 호출해야
//    한다 — 안 그러면 export하지 않은 admin 편집이 조용히 덮인다(2026-08-04 실제로 두 번 발생).
//    섹션마다 스크립트를 늘리지 말고 이 규약에 태울 것.

// biome-ignore lint/suspicious/noExplicitAny: 블록 데이터를 스키마 없이 그대로 옮긴다.
export type AnyData = any

/** 환경에 종속되거나 seed가 스스로 정하는 메타는 정본에서 제외한다. */
const DROP_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'globalType'])

/**
 * populate된 관계를 이식 가능한 키로 바꾼다 — id는 환경마다 달라 stage에서 깨진다.
 * 업로드는 filename(`{file}`), brand-colors는 hex(`{color}`)로 적는다.
 */
export function toPortable(value: AnyData): AnyData {
	if (Array.isArray(value)) return value.map(toPortable)
	if (value && typeof value === 'object') {
		if (typeof value.filename === 'string') return { file: value.filename }
		if (typeof value.hex === 'string') return { color: value.hex }
		const out: AnyData = {}
		for (const [key, v] of Object.entries(value)) {
			if (DROP_KEYS.has(key) || v == null) continue
			out[key] = toPortable(v)
		}
		return out
	}
	return value
}

/** toPortable의 역방향. 대상 DB에서 filename·hex로 실제 id를 찾는다. */
export function makeFromPortable(payload: BasePayload) {
	const findId = async (collection: CollectionSlug, where: AnyData): Promise<number | null> => {
		const { docs } = await payload.find({
			collection,
			where,
			limit: 1,
			depth: 0,
			overrideAccess: true,
		})
		return (docs[0]?.id as number) ?? null
	}

	async function fromPortable(value: AnyData): Promise<AnyData> {
		if (Array.isArray(value)) {
			const out: AnyData[] = []
			for (const v of value) out.push(await fromPortable(v))
			return out
		}
		if (value && typeof value === 'object') {
			if (typeof value.file === 'string') {
				for (const collection of ['brand-logos', 'application-images'] as const) {
					const id = await findId(collection, { filename: { equals: value.file } })
					if (id) return id
				}
				throw new Error(`에셋 없음: ${value.file}`)
			}
			if (typeof value.color === 'string') {
				const id = await findId('brand-colors', { hex: { equals: value.color } })
				if (!id) console.warn(`⚠️  brand-colors 없음(값 생략): ${value.color}`)
				return id
			}
			const out: AnyData = {}
			for (const [key, v] of Object.entries(value)) out[key] = await fromPortable(v)
			return out
		}
		return value
	}

	return fromPortable
}

/**
 * 🔴 정본 JSON보다 DB가 최신이면(= export하지 않은 admin 편집이 있으면) 쓰기를 막는다.
 * 콘텐츠를 쓰는 시드는 첫 줄에서 이걸 호출한다. FORCE=true로만 우회할 수 있다.
 */
export async function assertExported(
	payload: BasePayload,
	contentPath: string,
	slugs: string[],
): Promise<void> {
	const rel = path.relative(process.cwd(), contentPath)
	const exportedAt = await stat(contentPath).then(
		(s) => s.mtime,
		() => null,
	)
	if (!exportedAt) throw new Error(`정본 JSON 없음: ${rel} — 먼저 export할 것`)

	const stale: string[] = []
	for (const slug of slugs) {
		const { docs } = await payload.find({
			collection: 'guideline-documents',
			where: { slug: { equals: slug } },
			limit: 1,
			depth: 0,
			locale: 'ko',
			draft: false,
			overrideAccess: true,
		})
		const doc = docs[0]
		if (!doc?.updatedAt) continue
		if (new Date(doc.updatedAt) > exportedAt) stale.push(`${slug} (${doc.updatedAt})`)
	}

	if (stale.length === 0) return
	if (process.env.FORCE === 'true') {
		console.warn(`⚠️  FORCE=true — export하지 않은 편집을 덮어쓴다: ${stale.join(', ')}`)
		return
	}
	throw new Error(
		[
			`❌ DB가 정본보다 최신이다 — admin 편집이 ${rel}에 반영되지 않았다.`,
			...stale.map((s) => `   · ${s}`),
			'',
			'   먼저 export해서 편집을 정본으로 가져오고 커밋할 것.',
			'   의도적으로 덮어쓸 때만 FORCE=true를 붙인다.',
		].join('\n'),
	)
}
