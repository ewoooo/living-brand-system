import { getPayload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCheckSourceDocuments } from './check-ruleset.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('getCheckSourceDocuments', () => {
	beforeEach(() => {
		vi.mocked(getPayload).mockReset()
	})

	it('published 통합 문서를 checks[] 관계가 populate되는 depth로 한 번 조회한다', async () => {
		const find = vi.fn((_query: unknown) =>
			Promise.resolve({
				docs: [
					{
						id: 1,
						title: 'Brand',
						slug: 'brand',
						displayOrder: 1,
						breadcrumbs: [],
						blocks: [],
						checks: [],
					},
				],
			}),
		)
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const result = await getCheckSourceDocuments()

		expect(result.documents).toEqual([
			{
				id: 1,
				title: 'Brand',
				slug: 'brand',
				displayOrder: 1,
				breadcrumbDocumentIds: [],
				checks: [],
			},
		])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-documents',
				depth: 2,
				draft: false,
			}),
		)
		expect(find.mock.calls[0]?.[0]).not.toHaveProperty('where')
		expect(find).toHaveBeenCalledTimes(1)
	})

	it('Payload 관계와 Block Check를 persistence-free DTO로 변환한다', async () => {
		const checker = {
			id: 9,
			name: 'Layout checker',
			key: 'logo-layout',
			executor: 'deterministic',
			checkerKey: 'clear-space',
			model: null,
			prompt: '  inspect layout  ',
			updatedAt: '2026-07-17',
			createdAt: '2026-07-17',
		}
		const image = {
			id: 7,
			name: 'Logo reference',
			alt: 'Logo',
			url: '/api/application-images/file/logo.png',
			mimeType: 'image/png',
			updatedAt: '2026-07-17',
			createdAt: '2026-07-17',
		}
		const find = vi.fn(() =>
			Promise.resolve({
				docs: [
					{
						id: 30,
						title: 'Primary Logo',
						slug: 'primary-logo',
						displayOrder: 3,
						breadcrumbs: [{ doc: { id: 10 } }, { doc: 20 }, { doc: { id: 30 } }],
						checks: [],
						blocks: [
							{
								id: 'logo-examples',
								blockName: 'Logo examples',
								blockType: 'mediaShowcase',
								image,
								checks: [
									{
										key: 'logo.clear-space',
										title: 'Clear Space',
										titleKo: '보호 공간',
										tier: 'required',
										executor: 'deterministic',
										checker,
										options: { criteria: [] },
										criteria: [],
										messages: { pass: '통과' },
									},
								],
							},
						],
					},
				],
			}),
		)
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const { documents } = await getCheckSourceDocuments()

		expect(documents[0]).toMatchObject({
			id: 30,
			breadcrumbDocumentIds: [10, 20, 30],
			checks: [
				{
					check: {
						key: 'logo.clear-space',
						titleKo: '보호 공간',
						checker: {
							key: 'logo-layout',
							executor: 'deterministic',
							checkerKey: 'clear-space',
							prompt: '  inspect layout  ',
						},
						messages: { pass: '통과' },
					},
					source: { documentId: 30 },
					evidence: { type: 'mediaShowcase' },
					referenceAssets: [
						{
							name: 'Logo reference',
							url: '/api/application-images/file/logo.png',
							mimeType: 'image/png',
							role: 'context',
						},
					],
				},
			],
		})
		expect(documents[0]?.checks[0]?.check.checker).not.toHaveProperty('id')
		expect(documents[0]?.checks[0]?.referenceAssets[0]).not.toHaveProperty('alt')
	})

	it('손상된 breadcrumb 관계도 위치를 당기지 않고 sentinel로 보존한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 30,
					title: 'Primary Logo',
					slug: 'primary-logo',
					displayOrder: 3,
					breadcrumbs: [{ doc: null }, { doc: 20 }],
					checks: [],
					blocks: [],
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const { documents } = await getCheckSourceDocuments()

		expect(documents[0]?.breadcrumbDocumentIds).toEqual([-1, 20])
	})
})
