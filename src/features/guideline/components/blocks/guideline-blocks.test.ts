import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlocks } from './guideline-blocks'

const blocks: GuidelineDocument['blocks'] = [{ blockType: 'mediaShowcase', id: 'block-1' }]

describe('GuidelineBlocks', () => {
	it('Better Editor preview에서만 블록 선택 ID를 노출한다', () => {
		const { container, rerender } = render(createElement(GuidelineBlocks, { blocks }))

		expect(container.querySelector('[data-better-editor-id]')).toBeNull()

		rerender(createElement(GuidelineBlocks, { blocks, betterEditor: true }))

		expect(container.querySelector('[data-better-editor-id]')).toHaveAttribute(
			'data-better-editor-id',
			'block-1',
		)
	})
})
