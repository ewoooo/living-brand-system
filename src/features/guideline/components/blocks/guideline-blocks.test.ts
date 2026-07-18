import { render, within } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlocks } from './guideline-blocks'
import { MediaShowcaseBlock } from './media-showcase-block'

const blocks: GuidelineDocument['blocks'] = [{ blockType: 'mediaShowcase', id: 'block-1' }]
const carouselBlocks: GuidelineDocument['blocks'] = [
	{
		blockType: 'carousel',
		id: 'carousel',
		slides: [
			{ id: 'slide-1', image: 1 },
			{ id: 'slide-2', image: 2 },
		],
	},
]
type MediaShowcase = Extract<
	NonNullable<GuidelineDocument['blocks']>[number],
	{ blockType: 'mediaShowcase' }
>
const layoutBlocks: GuidelineDocument['blocks'] = [
	{ blockType: 'mediaShowcase', id: 'contained' },
	{ blockType: 'doDont', id: 'do-dont' },
	{
		blockType: 'carousel',
		id: 'carousel',
		slides: [{ id: 'slide', image: { url: '/slide.jpg', alt: '슬라이드' } as never }],
	},
]

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

	it.each([
		[2, 'md:grid-cols-2'],
		[3, 'md:grid-cols-3'],
	] as const)('미디어 %i개를 좌우 열로 렌더한다', (count, className) => {
		const block: MediaShowcase = {
			blockType: 'mediaShowcase',
			images: Array.from({ length: count }, (_, index) => ({ id: String(index) })),
		}
		const { container } = render(createElement(MediaShowcaseBlock, { block }))

		expect(container.firstElementChild).toHaveClass(className)
		expect(within(container).getAllByText('이미지 없음')).toHaveLength(count)
	})

	it('캐러셀 이미지가 populate되지 않으면 자체 간이 배경을 표시한다', () => {
		const { container } = render(createElement(GuidelineBlocks, { blocks: carouselBlocks }))

		expect(container.querySelectorAll('[role="img"][aria-label="이미지 없음"]')).toHaveLength(2)
	})

	it('배경 블록과 캐러셀만 콘텐츠 프레임을 벗어난다', () => {
		const { container } = render(createElement(GuidelineBlocks, { blocks: layoutBlocks }))
		const wrappers = Array.from(container.firstElementChild?.children ?? [])

		expect(wrappers[0]?.firstElementChild).toHaveAttribute('data-slot', 'content-frame')
		expect(wrappers[1]).toHaveClass('bg-neutral-100')
		expect(wrappers[1]?.firstElementChild).toHaveAttribute('data-slot', 'content-frame')
		expect(wrappers[2]?.firstElementChild).not.toHaveAttribute('data-slot', 'content-frame')
	})
})
