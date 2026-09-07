import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CardBlock } from '../blocks/shared/card-block'
import { Card } from './component'

// embla는 jsdom에 없는 브라우저 API를 요구한다 — 리포 선례(review-canvas.test)대로 껍데기로 바꾼다.
vi.mock('@/components/ui/carousel', () => ({
	Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CarouselItem: ({ children, className }: { children: ReactNode; className?: string }) => (
		<div data-slot="slide" className={className}>
			{children}
		</div>
	),
}))
afterEach(cleanup)

const image = (id: number) => ({ id, url: `/img-${id}.png`, alt: `그림 ${id}` })
const staticCard = (id: string, extra: object = {}) => ({
	id,
	ratio: '16:9',
	display: [{ id: `${id}-d`, blockType: 'staticDisplay', image: image(1) }],
	...extra,
})

describe('Card', () => {
	it('정적 디스플레이와 캡션(제목만)을 그린다', () => {
		const { container } = render(
			<Card
				card={
					staticCard('a', { ratio: '1:1', caption: { title: 'Forward Mark' } }) as never
				}
			/>,
		)
		expect(screen.getByRole('img')).toHaveAttribute('src', '/img-1.png')
		expect(container.querySelector('.aspect-square')).not.toBeNull()
		expect(screen.getByText('Forward Mark')).toBeInTheDocument()
	})

	it('캡션이 비면 figcaption을 만들지 않고, 디스플레이가 없으면 카드 자체를 그리지 않는다', () => {
		const { container } = render(<Card card={staticCard('a') as never} />)
		expect(container.querySelector('figcaption')).toBeNull()

		const empty = render(<Card card={{ id: 'b', ratio: '16:9', display: [] } as never} />)
		expect(empty.container).toBeEmptyDOMElement()
	})
})

describe('CardBlock', () => {
	it('블록의 줄 높이를 모든 카드 판에 주고 폭은 카드 비율이 정한다', () => {
		const { container } = render(
			<CardBlock
				title="한 눈에 보기"
				block={
					{
						layout: 'carousel',
						rowHeight: 'high',
						cards: [staticCard('a', { ratio: '9:16' }), staticCard('b')],
					} as never
				}
			/>,
		)
		expect(screen.getByRole('heading', { level: 2, name: '한 눈에 보기' })).toBeInTheDocument()
		const panels = [...container.querySelectorAll('figure > div')]
		expect(panels.map((el) => el.className.includes('md:h-[min(60vw,60rem)]'))).toEqual([
			true,
			true,
		])
		expect(panels[0]).toHaveClass('aspect-[9/16]')
		expect(panels[1]).toHaveClass('aspect-video')
		// 슬라이드 폭은 카드가 정한다.
		expect(container.querySelector('[data-slot="slide"]')).toHaveClass('md:basis-auto')
	})

	it('격자는 줄바꿈 행이고 rowHeight가 비면 보통이다', () => {
		const { container } = render(
			<CardBlock block={{ layout: 'grid', cards: [staticCard('a')] } as never} />,
		)
		expect(container.querySelector('.md\\:flex-wrap')).not.toBeNull()
		expect(container.querySelector('figure > div')).toHaveClass('md:h-[min(45vw,46rem)]')
	})
})
