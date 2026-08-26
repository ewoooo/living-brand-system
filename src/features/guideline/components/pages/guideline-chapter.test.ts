import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GuidelineChapter } from './guideline-chapter'

vi.mock('../refresh-route-on-save', () => ({
	RefreshRouteOnSave: () => 'refresh-route-on-save',
}))

const chapter = {
	title: 'Brand',
	label: null,
	description: null,
	topics: [],
}

describe('GuidelineChapter', () => {
	it('Preview에서만 저장 이벤트 새로고침을 연결한다', () => {
		const { queryByText, rerender } = render(
			createElement(GuidelineChapter, { chapter, chapterSlug: 'brand', isPreview: false }),
		)

		expect(queryByText('refresh-route-on-save')).toBeNull()

		rerender(
			createElement(GuidelineChapter, { chapter, chapterSlug: 'brand', isPreview: true }),
		)

		expect(queryByText('refresh-route-on-save')).not.toBeNull()
	})
})
