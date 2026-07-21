import { render, within } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { GuidelineDocument } from '@/payload-types'
import { DoDontBlock } from '../blocks/do-dont/component'
import { MediaShowcaseBlock } from '../blocks/media-showcase/component'
import { GuidelineBlockFrame } from '../blocks/shared/guideline-block-frame'
import { GuidelineBlocks } from './guideline-blocks'

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
type DoDont = Extract<NonNullable<GuidelineDocument['blocks']>[number], { blockType: 'doDont' }>
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

	it.each([
		[2, 'md:grid-cols-2'],
		[3, 'md:grid-cols-3'],
	] as const)('미디어 %i개를 좌우 열로 렌더한다', (count, className) => {
		const block: MediaShowcase = {
			blockType: 'mediaShowcase',
			images: Array.from({ length: count }, (_, index) => ({ id: String(index) })),
		}
		const { container } = render(createElement(MediaShowcaseBlock, { block }))
		const frame = container.querySelector('[data-slot="guideline-block-frame"]')

		expect(frame).toHaveClass('bg-background', 'text-foreground')
		expect(frame?.firstElementChild).toHaveAttribute('data-variant', 'padded')
		expect(frame?.querySelector('section')).toHaveClass(className)
		expect(within(container).getAllByText('이미지 없음')).toHaveLength(count)
	})

	it('캐러셀 이미지가 populate되지 않으면 자체 간이 배경을 표시한다', () => {
		const { container } = render(createElement(GuidelineBlocks, { blocks: carouselBlocks }))

		expect(container.querySelectorAll('[role="img"][aria-label="이미지 없음"]')).toHaveLength(2)
	})

	it.each([
		[1, 'lg:grid-cols-1'],
		[2, 'lg:grid-cols-2'],
		[3, 'lg:grid-cols-3'],
		[4, 'lg:grid-cols-2'],
		[5, 'lg:grid-cols-3'],
	] as const)('가로 Do/Don’t 예시 %i개를 정해진 열로 배치한다', (count, columnsClass) => {
		const block: DoDont = {
			blockType: 'doDont',
			groupLayout: 'horizontal',
			groups: Array.from({ length: count }, (_, index) => ({
				id: `group-${index}`,
				kind: 'do',
				examples: [{ id: `example-${index}`, image: index + 1 }],
			})),
		}
		const { container } = render(createElement(DoDontBlock, { block }))
		const grid = container.querySelector('section > div.grid')
		const cards = container.querySelectorAll('figure')

		expect(grid).toHaveClass(columnsClass)
		expect(cards).toHaveLength(count)
		for (const card of cards) expect(card.parentElement).not.toHaveClass('lg:col-span-2')
	})

	it.each([
		['2', 'lg:grid-cols-2'],
		['3', 'lg:grid-cols-3'],
		['4', 'lg:grid-cols-4'],
	] as const)('세로 Do/Don’t 그룹 내부 예시의 lg 열 수를 %s열로 지정한다', (exampleColumns, className) => {
		const block: DoDont = {
			blockType: 'doDont',
			exampleColumns,
			groups: [
				{
					id: 'group',
					kind: 'dont',
					examples: Array.from({ length: 4 }, (_, index) => ({
						id: `example-${index}`,
						image: index + 1,
					})),
				},
			],
		}
		const { container } = render(createElement(DoDontBlock, { block }))
		const grid = container.querySelector('section > div.flex > div > div.grid')

		expect(grid).toHaveClass(className)
	})

	it.each([
		2, 3,
	])('가로 Do/Don’t의 3개 그룹에 예시가 %i개씩이면 그룹별 세로 열로 배치한다', (examplesPerGroup) => {
		const block: DoDont = {
			blockType: 'doDont',
			groupLayout: 'horizontal',
			groups: Array.from({ length: 3 }, (_, groupIndex) => ({
				id: `group-${groupIndex}`,
				category: `그룹 ${groupIndex + 1}`,
				kind: 'dont',
				examples: Array.from({ length: examplesPerGroup }, (_, exampleIndex) => ({
					id: `example-${groupIndex}-${exampleIndex}`,
					image: groupIndex * examplesPerGroup + exampleIndex + 1,
				})),
			})),
		}
		const { container } = render(createElement(DoDontBlock, { block }))
		const grid = container.querySelector('section > div.grid')
		const groupColumns = Array.from(grid?.children ?? [])

		expect(grid).toHaveClass('lg:grid-cols-3')
		expect(groupColumns).toHaveLength(3)
		for (const group of groupColumns)
			expect(group.querySelectorAll('figure')).toHaveLength(examplesPerGroup)
	})

	it('각 블록이 콘텐츠 폭과 표면 색상을 소유한다', () => {
		const { container } = render(createElement(GuidelineBlocks, { blocks: layoutBlocks }))
		const wrappers = Array.from(container.firstElementChild?.children ?? [])
		const frames = wrappers.map((wrapper) => wrapper.firstElementChild)
		const contentFrames = frames.map((frame) => frame?.firstElementChild)

		for (const frame of frames) {
			expect(frame).toHaveAttribute('data-slot', 'guideline-block-frame')
		}
		expect(frames[0]).toHaveAttribute('data-variant', 'normal')
		expect(frames[0]).toHaveClass('bg-background', 'text-foreground')
		expect(frames[1]).toHaveAttribute('data-variant', 'secondary')
		expect(frames[1]).toHaveClass('bg-secondary', 'text-secondary-foreground')
		expect(frames[2]).toHaveAttribute('data-variant', 'secondary')
		expect(frames[2]).toHaveClass('bg-secondary', 'text-secondary-foreground')
		expect(contentFrames[0]).toHaveAttribute('data-variant', 'padded')
		expect(contentFrames[1]).toHaveAttribute('data-variant', 'padded')
		expect(contentFrames[2]).toHaveAttribute('data-variant', 'full')
		expect(contentFrames[2]).not.toHaveClass('max-w-[1250px]', 'px-4', 'md:px-8')
	})
})
