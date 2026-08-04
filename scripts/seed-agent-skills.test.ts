import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	find: vi.fn(),
	update: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
	getPayload: vi.fn(async () => mocks),
}))

describe('seed agent skills', () => {
	it('canonical Skill을 upsert한 뒤 활성 legacy Skill을 비활성화한다', async () => {
		mocks.find
			.mockResolvedValueOnce({ docs: [{ id: 7 }] })
			.mockResolvedValueOnce({ docs: [{ id: 8 }] })
			.mockResolvedValueOnce({ docs: [{ id: 9 }] })
			.mockResolvedValueOnce({ docs: [{ id: 10 }] })
			.mockResolvedValueOnce({ docs: [{ id: 11 }] })
			.mockResolvedValueOnce({
				docs: [
					{ id: 3, name: 'Template Asset Creator' },
					{ id: 5, name: 'Guideline Curator' },
					{ id: 6, name: 'Image Check' },
				],
			})
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)

		await import('./seed-agent-skills')

		expect(mocks.find).toHaveBeenLastCalledWith({
			collection: 'agent-skills',
			depth: 0,
			limit: 3,
			overrideAccess: true,
			where: {
				and: [
					{
						name: {
							in: ['Template Asset Creator', 'Guideline Curator', 'Image Check'],
						},
					},
					{ enabled: { equals: true } },
				],
			},
		})
		expect(
			mocks.update.mock.calls
				.map(([input]) => input)
				.filter(({ data }) => data.enabled === false),
		).toEqual([
			{
				collection: 'agent-skills',
				id: 3,
				data: { enabled: false },
				overrideAccess: true,
			},
			{
				collection: 'agent-skills',
				id: 5,
				data: { enabled: false },
				overrideAccess: true,
			},
			{
				collection: 'agent-skills',
				id: 6,
				data: { enabled: false },
				overrideAccess: true,
			},
		])
	})
})
