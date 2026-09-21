import { describe, expect, it } from 'vitest'
import { type GeneratedImageHistoryItem, groupHistoryByDate } from './generated-image-history'

function item(id: number, createdAt: string): GeneratedImageHistoryItem {
	return {
		aspectRatio: '1:1',
		createdAt,
		id,
		imageSize: '1K',
		profileId: 6,
		profileName: 'Technical Illustration',
		prompt: '강아지',
		url: `/file/${id}.jpg`,
	}
}

describe('groupHistoryByDate', () => {
	// 로컬 자정이 경계다 — 한국(UTC+9)에서 09-21 01:00은 오늘이고, 09-20 23:00 UTC도 오늘이다.
	const today = new Date('2026-09-21T12:00:00+09:00')

	it('오늘·어제는 이름으로, 그 앞은 날짜로 적는다', () => {
		const groups = groupHistoryByDate(
			[
				item(1, '2026-09-21T01:00:00+09:00'),
				item(2, '2026-09-20T22:00:00+09:00'),
				item(3, '2026-09-11T09:00:00+09:00'),
				item(4, '2025-12-24T09:00:00+09:00'),
			],
			today,
		)

		expect(groups.map((group) => group.label)).toEqual([
			'오늘',
			'어제',
			'9월 11일',
			'2025년 12월 24일',
		])
		expect(groups.map((group) => group.items.length)).toEqual([1, 1, 1, 1])
	})

	it('같은 날이 이어지면 한 묶음이 된다', () => {
		const groups = groupHistoryByDate(
			[
				item(1, '2026-09-21T15:00:00+09:00'),
				item(2, '2026-09-21T09:00:00+09:00'),
				item(3, '2026-09-20T09:00:00+09:00'),
			],
			today,
		)

		expect(groups).toHaveLength(2)
		expect(groups[0]?.items.map(({ id }) => id)).toEqual([1, 2])
	})

	// 🔴 날짜별로 다시 모으지 않는다 — 최신순이 깨진 목록이 와도 순서를 그대로 둔다.
	//    다시 모으면 페이지가 이어 붙을 때 이미 그린 그룹에 항목이 끼어들어 격자가 흔들린다.
	it('같은 날짜가 떨어져 있으면 묶지 않고 순서를 지킨다', () => {
		const groups = groupHistoryByDate(
			[
				item(1, '2026-09-21T09:00:00+09:00'),
				item(2, '2026-09-20T09:00:00+09:00'),
				item(3, '2026-09-21T08:00:00+09:00'),
			],
			today,
		)

		expect(groups.map((group) => group.label)).toEqual(['오늘', '어제', '오늘'])
	})

	it('빈 목록은 그룹도 없다', () => {
		expect(groupHistoryByDate([], today)).toEqual([])
	})
})
