import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlocks } from './guideline-blocks'

const blocks: GuidelineDocument['blocks'] = [
	{ blockType: 'section', id: 'section-1', title: 'Color', anchor: 'color', children: [] },
]

describe('GuidelineBlocks', () => {
	it('Better Editor preview에서만 블록 선택 ID를 노출한다', () => {
		const { container, rerender } = render(createElement(GuidelineBlocks, { blocks }))

		expect(container.querySelector('[data-better-editor-id]')).toBeNull()

		rerender(createElement(GuidelineBlocks, { blocks, betterEditor: true }))

		expect(container.querySelector('[data-better-editor-id]')).toHaveAttribute(
			'data-better-editor-id',
			'section-1',
		)
	})

	it('제목 없는 섹션은 헤딩과 앵커를 만들지 않는다', () => {
		const { container } = render(
			createElement(GuidelineBlocks, {
				blocks: [{ blockType: 'section', id: 'hero', children: [] }],
			}),
		)

		expect(container.querySelector('h2')).toBeNull()
		expect(container.querySelector('section')?.id).toBe('')
	})
})
