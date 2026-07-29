import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Block-Widget Test 챕터 시드 — block 레이아웃(grid/carousel/masonry·폭) 샘플.
 *
 * Block(레이아웃 컨테이너)이 leaf(Image·Widget)를 배치하는 각 arrangement를 한 페이지에 나열한다.
 * 내부 이미지는 application-images에서 랜덤 선택(임의 생성 안 함).
 * 재실행 안전: slug로 upsert(있으면 blocks 갱신, 없으면 생성). application-images가 없으면 건너뜀.
 *
 * 실행: pnpm payload run scripts/seed-block-widget-test.ts
 */
type Block = NonNullable<GuidelineDocument['blocks']>[number]
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 블록 필드를 느슨하게 다룬다.
type AnyBlock = any

const payload = await getPayload({ config })

const { docs: images } = await payload.find({
	collection: 'application-images',
	limit: 100,
	depth: 0,
	overrideAccess: true,
})

if (images.length === 0) {
	console.log('application-images 없음 — 시드 건너뜀(에셋 프로비저닝 필요)')
} else {
	const pick = (n: number) =>
		[...images]
			.sort(() => Math.random() - 0.5)
			.slice(0, n)
			.map((image) => image.id)
	const imageLeaves = (n: number): AnyBlock[] =>
		pick(n).map((id) => ({ blockType: 'image', image: id }))

	const layout = (
		arrangement: string,
		columns: number,
		count: number,
		width = 'padded',
	): AnyBlock => ({
		blockType: 'block',
		width,
		arrangement,
		columns,
		children: imageLeaves(count),
	})

	const sampleBlocks: Block[] = [
		layout('grid', 1, 1), // 1×1 단일
		layout('grid', 3, 3), // W×1 수평 배치
		layout('grid', 3, 6), // W×H 격자
		layout('grid', 2, 2, 'full'), // 전체폭
		layout('carousel', 3, 6), // 캐러셀(가로 스크롤)
		layout('masonry', 3, 6), // 메이슨리(높이 불균일)
		// 형제 위계 데모: Image leaf + Widget leaf를 한 block에 나란히
		{
			blockType: 'block',
			width: 'padded',
			arrangement: 'grid',
			columns: 3,
			children: [...imageLeaves(2), { blockType: 'colorPaletteWidget' }],
		} as AnyBlock,
	] as Block[]

	async function upsert(opts: {
		slug: string
		title: string
		parentId?: number
		blocks?: Block[]
		order: number
	}): Promise<number> {
		const { docs } = await payload.find({
			collection: 'guideline-documents',
			where: { slug: { equals: opts.slug } },
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			depth: 0,
			limit: 1,
		})
		const data: Record<string, unknown> = {
			title: opts.title,
			slug: opts.slug,
			_status: 'published',
			displayOrder: opts.order,
		}
		if (opts.parentId != null) data.parent = opts.parentId
		if (opts.blocks) data.blocks = opts.blocks

		if (docs[0]) {
			await payload.update({
				collection: 'guideline-documents',
				id: docs[0].id,
				locale: 'ko',
				draft: false,
				overrideAccess: true,
				data,
			})
			return docs[0].id as number
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

	const chapterId = await upsert({
		slug: 'block-widget-test',
		title: 'Block-Widget Test',
		order: 999,
	})
	const sectionId = await upsert({
		slug: 'block-widget-test-section',
		title: 'Test Section',
		parentId: chapterId,
		order: 0,
	})
	await upsert({
		slug: 'block-widget-test-page',
		title: 'Test Page',
		parentId: sectionId,
		blocks: sampleBlocks,
		order: 0,
	})
	console.log(
		`시드 완료: Block-Widget Test(${chapterId}) > Test Section(${sectionId}) > Test Page (블록 ${sampleBlocks.length}개)`,
	)
}
