import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { GuidelineDocuments } from '@/collections/GuidelineDocuments'
import { checkKeyFromEnglishTitle } from '@/features/quality-rule/check-key-from-english-title'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { ContentColumnsBlock } from '../blocks/content-columns/schema'
import { guidelineRulesField } from '../blocks/shared/fields'
import { DoDontWidget } from '../widgets/do-dont/schema'
import { guidelineBlockProjectors } from './projection.generated'
import { guidelineBlockRenderers } from './renderer.generated'
import { guidelineBlockSchemas, guidelineBlocks } from './schema.generated'

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

		expect(names.indexOf('chapter')).toBeLessThan(names.indexOf('title'))
		expect(names.indexOf('blocks')).toBeLessThan(names.indexOf('rules'))
		expect(field('chapter')?.admin?.position).toBe('main')
	})

	it('Better Editor 버튼을 게시 컨트롤 앞에 둔다', () => {
		expect(GuidelineDocuments.admin?.components?.edit?.PublishButton).toBe(
			'/components/admin/guideline-documents/better-editor-publish-button#BetterEditorPublishButton',
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

	it('문서와 블록은 Rule 정의 필드를 소유하지 않는다', () => {
		expect(fieldNames(GuidelineDocuments.fields)).not.toContain('checks')
		for (const block of guidelineBlocks) {
			expect(fieldNames(block.fields)).not.toContain('checks')
		}
	})

	it('세 카탈로그 key와 Payload slug를 같은 순서로 생성한다', () => {
		const schemaEntries = Object.entries(guidelineBlockSchemas)
		const keys = schemaEntries.map(([key]) => key)

		expect(Object.keys(guidelineBlockProjectors)).toEqual(keys)
		expect(Object.keys(guidelineBlockRenderers)).toEqual(keys)
		expect(schemaEntries.map(([key, schema]) => [key, schema.slug])).toEqual(
			keys.map((key) => [key, key]),
		)
	})

	it('Do/Don’t 이미지 비율에 공용 계약을 사용한다', () => {
		const row = DoDontWidget.fields.find((field) => field.type === 'row')
		if (row?.type !== 'row') throw new Error('Do/Don’t option row is missing')
		const imageRatio = row.fields.find(
			(field) => 'name' in field && field.name === 'imageRatio',
		)
		if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')

		expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)
		const exampleColumns = row.fields.find(
			(field) => 'name' in field && field.name === 'columns',
		)
		if (exampleColumns?.type !== 'select') throw new Error('columns select is missing')

		expect(exampleColumns.defaultValue).toBe('3')
		expect(exampleColumns.options).toEqual([
			{ label: '2열', value: '2' },
			{ label: '3열', value: '3' },
			{ label: '4열', value: '4' },
		])
		expect(IMAGE_RATIO_OPTIONS.map(({ value }) => value)).toEqual([
			'original',
			'1:1',
			'5:4',
			'4:3',
			'3:2',
			'16:9',
			'2:1',
			'7:3',
			'4:5',
			'3:4',
			'2:3',
			'9:16',
		])
	})

	it('다른 이미지 블록도 공용 비율 계약을 사용한다', () => {
		for (const [block, defaultValue] of [[ContentColumnsBlock, '4:3']] as const) {
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
