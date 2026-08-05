import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { findPublishedCheckScenarios } from './check-scenario.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('findPublishedCheckScenarios', () => {
	it('published이며 archived가 아닌 시나리오 정의만 읽는다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					key: 'quick',
					title: '빠른 기본 검수',
					checkKeys: ['color.palette', null],
					aliases: ['빠른 검수'],
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(findPublishedCheckScenarios()).resolves.toEqual([
			{
				key: 'quick',
				title: '빠른 기본 검수',
				checkKeys: ['color.palette'],
				aliases: ['빠른 검수'],
			},
		])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'check-scenarios',
				draft: false,
				overrideAccess: true,
				where: { archived: { not_equals: true } },
			}),
		)
	})
})
