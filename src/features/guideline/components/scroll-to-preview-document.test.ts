import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ScrollToPreviewDocument } from './scroll-to-preview-document'

describe('ScrollToPreviewDocument', () => {
	it('페이지 대상을 iframe 안의 토픽 스크롤 컨테이너 상단으로 이동한다', () => {
		const scrollContainer = document.createElement('div')
		const target = document.createElement('article')
		const scrollTo = vi.fn()

		scrollContainer.dataset.slot = 'section-scroll-container'
		scrollContainer.scrollTop = 40
		scrollContainer.scrollTo = scrollTo
		target.id = 'primary-typeface'
		scrollContainer.append(target)
		document.body.append(scrollContainer)

		vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect)
		vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect)

		render(createElement(ScrollToPreviewDocument, { targetId: 'primary-typeface' }))

		expect(scrollTo).toHaveBeenCalledWith({ top: 240 })
		scrollContainer.remove()
	})
})
