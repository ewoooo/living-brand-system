import { describe, expect, it } from 'vitest'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { DoDontWidget } from './schema'

describe('Do/Don’t 위젯 스키마', () => {
	it('이미지 비율에 공용 계약을 쓰고 열 수 기본은 3이다', () => {
		const row = DoDontWidget.fields.find((field) => field.type === 'row')
		if (row?.type !== 'row') throw new Error('option row is missing')
		const imageRatio = row.fields.find(
			(field) => 'name' in field && field.name === 'imageRatio',
		)
		if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')
		expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)

		const columns = row.fields.find((field) => 'name' in field && field.name === 'columns')
		if (columns?.type !== 'select') throw new Error('columns select is missing')
		expect(columns.defaultValue).toBe('3')
		expect(columns.options).toEqual([
			{ label: '2열', value: '2' },
			{ label: '3열', value: '3' },
			{ label: '4열', value: '4' },
		])
	})
})
