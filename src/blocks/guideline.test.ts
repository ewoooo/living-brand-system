import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { GuidelineDocuments } from '@/collections/GuidelineDocuments'
import {
	guidelineBreadcrumbCount,
	guidelineDocumentTypeLabel,
} from '@/components/admin/guideline-document-tree'
import { guidelineBlockCatalog, guidelineBlocks } from '@/features/guideline/blocks/catalog'
import { checkKeyFromEnglishTitle } from '@/features/guideline/checks/check-key-from-english-title'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import {
	ContentColumnsBlock,
	DoDontBlock,
	guidelineRulesField,
	MediaShowcaseBlock,
} from './guideline'

const fieldNames = (fields: Field[]) =>
	fields.flatMap((field) =>
		'name' in field && typeof field.name === 'string' ? [field.name] : [],
	)

describe('guideline rules field', () => {
	it('작성 순서와 자동 계층 필드 노출을 구성한다', () => {
		const names = fieldNames(GuidelineDocuments.fields)
		const field = (name: string) =>
			GuidelineDocuments.fields.find(
				(candidate) => 'name' in candidate && candidate.name === name,
			)

		expect(names.indexOf('parent')).toBeLessThan(names.indexOf('title'))
		expect(names.indexOf('blocks')).toBeLessThan(names.indexOf('rules'))
		expect(field('parent')?.admin?.position).toBe('main')
		expect(field('breadcrumbs')?.admin).toMatchObject({ hidden: true })
	})

	it('저장된 계층 깊이를 문서 유형으로 표시한다', () => {
		expect(guidelineBreadcrumbCount([{ url: '/chapter' }], undefined, 0)).toBe(1)
		expect(guidelineBreadcrumbCount(undefined, [{ url: '/chapter/section' }], 0)).toBe(1)
		expect(guidelineBreadcrumbCount(undefined, undefined, 3)).toBe(3)
		expect(guidelineDocumentTypeLabel(1, false, false)).toBe('챕터')
		expect(guidelineDocumentTypeLabel(2, true, false)).toBe('섹션')
		expect(guidelineDocumentTypeLabel(3, true, false)).toBe('페이지')
		expect(guidelineDocumentTypeLabel(2, true, true)).toBe('저장 후 결정')
	})

	it('Better Editor 버튼을 게시 컨트롤 앞에 둔다', () => {
		expect(GuidelineDocuments.admin?.components?.edit?.PublishButton).toBe(
			'/components/admin/BetterEditorPublishButton',
		)
		expect(
			GuidelineDocuments.fields.find((field) => 'name' in field && field.name === 'blocks')
				?.admin?.components?.Field,
		).toBeUndefined()
	})

	it('통합 문서와 모든 Block이 같은 rules 관계 계약을 둔다', () => {
		const rules = guidelineRulesField()
		expect(rules.type).toBe('relationship')
		if (rules.type !== 'relationship') return
		expect(rules.relationTo).toBe('rules')
		expect(rules.hasMany).toBe(true)

		expect(fieldNames(GuidelineDocuments.fields)).toContain('rules')
		for (const block of guidelineBlocks) expect(fieldNames(block.fields)).toContain('rules')
	})

	it('서체를 다루는 블록은 같은 typeface 관계 계약을 둔다', () => {
		for (const type of ['typeScale', 'typeSpecimen', 'glyphGrid'] as const) {
			const definition = guidelineBlockCatalog[type]
			const typeface = definition.schema.fields.find(
				(field) => 'name' in field && field.name === 'typeface',
			)
			expect(typeface?.type).toBe('relationship')
			if (typeface?.type !== 'relationship') continue
			expect(typeface.relationTo).toBe('brand-typefaces')
		}
	})

	it('문서와 블록은 Rule 정의 필드를 소유하지 않는다', () => {
		expect(fieldNames(GuidelineDocuments.fields)).not.toContain('checks')
		for (const block of guidelineBlocks) {
			expect(fieldNames(block.fields)).not.toContain('checks')
		}
	})

	it('블록 카탈로그 key와 Payload slug를 같은 순서로 등록한다', () => {
		expect(
			Object.entries(guidelineBlockCatalog).map(([type, definition]) => [
				type,
				definition.schema.slug,
			]),
		).toEqual([
			['contentColumns', 'contentColumns'],
			['mediaShowcase', 'mediaShowcase'],
			['colorPalette', 'colorPalette'],
			['doDont', 'doDont'],
			['policyCallout', 'policyCallout'],
			['specList', 'specList'],
			['signatureShowcase', 'signatureShowcase'],
			['typeSpecimen', 'typeSpecimen'],
			['typeScale', 'typeScale'],
			['layoutGrid', 'layoutGrid'],
			['glyphGrid', 'glyphGrid'],
		])
	})

	it('Do/Don’t 이미지 비율에 공용 계약을 사용한다', () => {
		const row = DoDontBlock.fields.find((field) => field.type === 'row')
		if (row?.type !== 'row') throw new Error('Do/Don’t option row is missing')
		const imageRatio = row.fields.find(
			(field) => 'name' in field && field.name === 'imageRatio',
		)
		if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')

		expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)
		expect(IMAGE_RATIO_OPTIONS.map(({ value }) => value)).toEqual([
			'4:3',
			'1:1',
			'16:9',
			'3:2',
			'2:3',
			'4:5',
			'5:4',
			'9:16',
		])
	})

	it('다른 이미지 블록도 공용 비율 계약을 사용한다', () => {
		for (const [block, defaultValue] of [
			[ContentColumnsBlock, '4:3'],
			[MediaShowcaseBlock, '16:9'],
		] as const) {
			const imageRatio = block.fields.find(
				(field) => 'name' in field && field.name === 'imageRatio',
			)
			if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')

			expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)
			expect(imageRatio.defaultValue).toBe(defaultValue)
		}
	})

	it('영문 제목에서 namespace 없는 안정적인 key를 만든다', () => {
		expect(checkKeyFromEnglishTitle('Imagery Mood & Tone')).toBe('imagery-mood-tone')
		expect(checkKeyFromEnglishTitle('  Logo / Clear Space  ')).toBe('logo-clear-space')
	})
})
