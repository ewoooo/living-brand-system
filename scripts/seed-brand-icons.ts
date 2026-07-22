import { readFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * brand-icons 컬렉션에 essenherb 아이콘 40종을 시드한다(업로드 컬렉션이라 파일 포함).
 * - 파일 소스: src/features/guideline/blocks/icon-grid/svg/<n>.svg (현재 블록이 쓰던 svg)
 * - 순번은 아이콘 고유 값이 아니라 등록 순서라, 아래 DISPLAY_ORDER(현재 렌더 순서)대로 순차 생성한다.
 * - group은 현재 컴포넌트의 카테고리 구간(표시 위치 기준)을 그대로 옮긴다.
 * - 이미 같은 name이 있으면 건너뛴다(재실행 안전).
 *
 * 실행: pnpm payload run scripts/seed-brand-icons.ts
 */

// 현재 그리드 렌더 순서(component ORDERED 결과)를 svg 파일 번호로 나열한 것.
const DISPLAY_ORDER = [
	1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32,
	33, 34, 35, 37, 38, 363, 41, 42, 43, 44, 45, 46, 47, 48,
]

// 표시 위치(1..40) → 그룹. component CATEGORY_RANGES와 동일.
function groupOf(position: number): string {
	if (position <= 16) return '자연 원료'
	if (position <= 24) return '한국 전통 문화 속 자연'
	if (position <= 28) return '생동감 있는 감정'
	if (position <= 32) return 'Essenherb 제품 제형'
	return 'Essenherb 제품 라인업'
}

const svgDir = path.resolve(process.cwd(), 'src/features/guideline/blocks/icon-grid/svg')

const payload = await getPayload({ config })

let created = 0
let skipped = 0

for (let i = 0; i < DISPLAY_ORDER.length; i++) {
	const position = i + 1
	const fileNumber = DISPLAY_ORDER[i]
	const name = `아이콘 ${position}`

	const existing = await payload.find({
		collection: 'brand-icons',
		where: { name: { equals: name } },
		limit: 1,
		overrideAccess: true,
	})
	if (existing.docs.length > 0) {
		skipped++
		continue
	}

	const buffer = await readFile(path.join(svgDir, `${fileNumber}.svg`))
	await payload.create({
		collection: 'brand-icons',
		data: { name, group: groupOf(position), _status: 'published' },
		file: {
			data: buffer,
			mimetype: 'image/svg+xml',
			name: `${fileNumber}.svg`,
			size: buffer.length,
		},
		overrideAccess: true,
	})
	created++
	console.log(`생성: ${name} (group: ${groupOf(position)}, file: ${fileNumber}.svg)`)
}

console.log(`\n완료 — 생성 ${created}개, 건너뜀 ${skipped}개`)
