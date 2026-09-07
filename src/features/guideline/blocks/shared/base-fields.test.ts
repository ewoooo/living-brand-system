import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { blockEntry, blockSchema } from '../registry'
import { baseContentFields, presetFields } from './base-fields'

function flat(fields: Field[]): Field[] {
	return fields.flatMap((field) =>
		'fields' in field && field.type === 'row' ? field.fields : [field],
	)
}
function named(fields: Field[], name: string) {
	return flat(fields).find((field) => 'name' in field && field.name === name) as Field & {
		defaultValue?: unknown
		admin?: { hidden?: boolean }
	}
}

const OverviewBlock = blockSchema(blockEntry('overview'))
const ExamplesBlock = blockSchema(blockEntry('examples'))

describe('슈거 블록', () => {
	// 🔴 슈거는 새 필드를 만들지 않는다 — 기본 블록과 같은 필드 이름 집합이어야 한다.
	it('기본 블록과 같은 필드를 갖는다', () => {
		const base = flat(baseContentFields()).map((f) => ('name' in f ? f.name : f.type))
		for (const block of [OverviewBlock, ExamplesBlock]) {
			expect(flat(block.fields).map((f) => ('name' in f ? f.name : f.type))).toEqual(base)
		}
	})

	it('고정값은 defaultValue로 채우고 admin에서 숨긴다', () => {
		expect(named(OverviewBlock.fields, 'layout')).toMatchObject({
			defaultValue: 'carousel',
			admin: { hidden: true },
		})
		expect(named(OverviewBlock.fields, 'rowHeight').defaultValue).toBe('medium')
		expect(named(ExamplesBlock.fields, 'layout').defaultValue).toBe('carousel')
	})

	it('presetFields는 row 안의 필드도 찾는다', () => {
		const fields = presetFields(baseContentFields(), { layout: { defaultValue: 'carousel' } })
		expect(named(fields, 'layout').defaultValue).toBe('carousel')
		expect(named(fields, 'title').admin?.hidden).toBeUndefined()
	})
})
