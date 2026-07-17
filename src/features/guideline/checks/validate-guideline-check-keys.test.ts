import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listGuidelineCheckContainers } from '../repositories/guideline-document.payload.repository'
import {
	collectCheckKeys,
	findDuplicateGuidelineCheckKey,
} from '../services/validate-guideline-check-keys.service'
import { validateGuidelineCheckKeys } from './validate-guideline-check-keys'

vi.mock('../repositories/guideline-document.payload.repository', () => ({
	listGuidelineCheckContainers: vi.fn(),
}))

const listSavedDocuments = vi.mocked(listGuidelineCheckContainers)

describe('validateGuidelineCheckKeys', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		listSavedDocuments.mockResolvedValue([])
	})

	it('문서와 Block의 영문 제목에서 저장 예정 key를 수집한다', () => {
		expect(
			collectCheckKeys({
				checks: [{ title: 'Logo Clear Space' }],
				blocks: [{ checks: [{ key: 'imagery-mood', title: 'Ignored title' }] }],
			}),
		).toEqual(['logo-clear-space', 'imagery-mood'])
	})

	it('다른 Guideline 문서에 같은 key가 있으면 저장 전에 거부한다', async () => {
		listSavedDocuments.mockResolvedValue([
			{ id: 10, checks: [{ key: 'imagery-mood' }], blocks: [] },
		] as never)
		const req = {} as never

		await expect(
			validateGuidelineCheckKeys({
				collection: { slug: 'guideline-documents' },
				data: { checks: [{ title: 'Imagery Mood' }] },
				operation: 'create',
				req,
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '이미 사용 중인 Check key입니다: imagery-mood' }],
			},
		})
		expect(listSavedDocuments).toHaveBeenCalledWith(req)
	})

	it('같은 문서 안의 중복은 저장소 조회 전에 찾는다', async () => {
		const document = { checks: [{ key: 'logo' }, { key: 'logo' }] }

		expect(findDuplicateGuidelineCheckKey(document, [], null)).toBe('logo')
		await expect(
			validateGuidelineCheckKeys({
				collection: { slug: 'guideline-documents' },
				data: document as never,
				operation: 'create',
				req: {},
			} as never),
		).rejects.toMatchObject({
			data: { errors: [{ message: expect.stringContaining('logo') }] },
		})
		expect(listSavedDocuments).not.toHaveBeenCalled()
	})

	it('백필 migration context에서는 기존 컬렉션과의 일시적인 중복을 허용한다', async () => {
		const data = { checks: [{ title: 'Imagery Mood' }] }

		await expect(
			validateGuidelineCheckKeys({
				collection: { slug: 'guideline-documents' },
				data,
				operation: 'create',
				req: {
					context: { skipGuidelineCheckUniqueness: true },
				},
			} as never),
		).resolves.toBe(data)
		expect(listSavedDocuments).not.toHaveBeenCalled()
	})
})
