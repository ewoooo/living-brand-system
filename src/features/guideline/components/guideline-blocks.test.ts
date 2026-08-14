import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../blocks/shared/guideline-block-frame'
import { GuidelineBlocks } from './guideline-blocks'

// 1세대 블록(mediaShowcase·carousel·doDont)을 렌더하던 단언은 그 블록들과 함께 지웠다.
// 남은 것은 세대와 무관한 두 계약이다 — 프레임의 표면 색과 Better Editor 선택 ID 노출.
const blocks: GuidelineDocument['blocks'] = [{ blockType: 'block', id: 'block-1' }]

describe('GuidelineBlocks', () => {
	it.each([
		['normal', undefined, 'bg-background', 'text-foreground'],
		['secondary', 'secondary', 'bg-secondary', 'text-secondary-foreground'],
		['inverted', 'inverted', 'bg-foreground', 'text-background'],
	] as const)('블록 컬러 variant %s를 적용한다', (expectedVariant, variant, backgroundClass, foregroundClass) => {
		const { container } = render(
			createElement(GuidelineBlockFrame, { layout: 'full', variant }, '내용'),
		)
		const frame = container.firstElementChild

		expect(frame).toHaveAttribute('data-variant', expectedVariant)
		expect(frame).toHaveClass(backgroundClass, foregroundClass)
	})

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
