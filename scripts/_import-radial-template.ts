/**
 * [throwaway] Figma 방사형 예시를 로컬 DB Template으로 생성 (dogfood).
 * bg + 8 텍스트만 import(이미지 0 → 인가 게이트 통과). Center는 나중에 코드가 그림.
 * 실행: source ~/.nvm/nvm.sh && nvm use 22 && pnpm exec payload run scripts/_import-radial-template.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import { findFigmaNodeTree } from '@/features/template-import/repositories/figma.rest.repository'
import { convertFigmaNodeTree } from '@/features/template-import/utils/convert-figma-node-tree'

const fileKey = 'Wl9p2kQENUqapg6iOVHVOF'
const nodeId = '161:5'
const NAME = '방사형 라벨 (원형 배치)'

const payload = await getPayload({ config })

const root = await findFigmaNodeTree(fileKey, nodeId)
const jsonTemplate = convertFigmaNodeTree(root, {})
console.log(`converted: ${jsonTemplate.width}x${jsonTemplate.height} bg=${jsonTemplate.background} elements=${jsonTemplate.elements.length}`)

// 카테고리 find-or-create (스테이셔너리 재사용, 없으면 첫 카테고리)
const cats = await payload.find({ collection: 'template-categories', limit: 1, overrideAccess: true })
if (cats.docs.length === 0) {
	throw new Error('template-categories가 없음 — 먼저 카테고리를 만들어줘')
}
const categoryId = cats.docs[0].id
console.log(`category: ${categoryId}`)

// 이미 있으면 스킵
const existing = await payload.find({
	collection: 'templates',
	where: { name: { equals: NAME } },
	limit: 1,
	overrideAccess: true,
})
if (existing.docs.length > 0) {
	console.log(`이미 존재: template id=${existing.docs[0].id} — 스킵`)
} else {
	const created = await payload.create({
		collection: 'templates',
		data: {
			name: NAME,
			category: categoryId,
			jsonTemplate,
			_status: 'published',
		},
		overrideAccess: true,
	})
	console.log(`created: template id=${created.id}`)
}
