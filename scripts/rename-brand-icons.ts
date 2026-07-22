import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * brand-icons의 name만 임시 영문 이름으로 갱신한다(파일명·기타 필드는 건드리지 않음).
 * 형태는 svg를 정확히 못 읽어 대략 인식 + 그룹 가이드로 지은 임시값이라, 이후 manager가 admin에서 다듬으면 된다.
 * 파일명(<n>.svg)으로 매칭하므로 재실행 안전.
 *
 * 실행: pnpm payload run scripts/rename-brand-icons.ts
 */

// 표시순 1..40의 svg 파일 번호(seed와 동일 DISPLAY_ORDER).
const DISPLAY_ORDER = [
	1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32,
	33, 34, 35, 37, 38, 363, 41, 42, 43, 44, 45, 46, 47, 48,
]

// 표시순 1..40의 임시 이름. 전부 unique.
const NAMES = [
	'Clover',
	'Blossom',
	'Log',
	'Shrub',
	'Seaweed',
	'Sprout',
	'Frond',
	'Fish',
	'Shell',
	'Mushroom',
	'Herb',
	'Coral',
	'Bloom',
	'Berry',
	'Palm',
	'Snail',
	'Grove',
	'Hills',
	'Gourd',
	'Wave',
	'Mountain',
	'Cloud',
	'Sun',
	'Moon',
	'Love',
	'Joy',
	'Serenity',
	'Passion',
	'Silk',
	'Gloss',
	'Velvet',
	'Foam',
	'Ampoule',
	'Serum',
	'Toner',
	'Lotion',
	'Cream',
	'Powder',
	'Pump',
	'Mist',
]

if (new Set(NAMES).size !== NAMES.length || NAMES.length !== DISPLAY_ORDER.length) {
	throw new Error('NAMES는 40개이고 전부 unique해야 합니다.')
}

const payload = await getPayload({ config })

let updated = 0
let missing = 0

for (let i = 0; i < DISPLAY_ORDER.length; i++) {
	const filename = `${DISPLAY_ORDER[i]}.svg`
	const name = NAMES[i]

	const found = await payload.find({
		collection: 'brand-icons',
		where: { filename: { equals: filename } },
		limit: 1,
		overrideAccess: true,
	})
	if (found.docs.length === 0) {
		console.warn(`파일 매칭 실패(건너뜀): ${filename}`)
		missing++
		continue
	}

	await payload.update({
		collection: 'brand-icons',
		id: found.docs[0].id,
		data: { name, _status: 'published' },
		overrideAccess: true,
	})
	updated++
	console.log(`${filename} → ${name}`)
}

console.log(`\n완료 — 갱신 ${updated}개, 누락 ${missing}개`)
