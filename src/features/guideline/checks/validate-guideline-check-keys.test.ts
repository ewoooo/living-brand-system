import { describe, expect, it, vi } from 'vitest'
import { collectCheckKeys, validateGuidelineCheckKeys } from './validate-guideline-check-keys'

describe('validateGuidelineCheckKeys', () => {
	it('문서와 Block의 영문 제목에서 저장 예정 key를 수집한다', () => {
		expect(
			collectCheckKeys({
				checks: [{ title: 'Logo Clear Space' }],
				blocks: [{ checks: [{ key: 'imagery-mood', title: 'Ignored title' }] }],
			}),
		).toEqual(['logo-clear-space', 'imagery-mood'])
	})

	it('다른 Guideline 문서에 같은 key가 있으면 저장 전에 거부한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [{ id: 10, checks: [{ key: 'imagery-mood' }], blocks: [] }],
		})

		await expect(
			validateGuidelineCheckKeys({
				collection: { slug: 'guideline-documents' },
				data: { checks: [{ title: 'Imagery Mood' }] },
				operation: 'create',
				req: { payload: { find } },
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '이미 사용 중인 Check key입니다: imagery-mood' }],
			},
		})
	})

	it('백필 migration context에서는 기존 컬렉션과의 일시적인 중복을 허용한다', async () => {
		const find = vi.fn()
		const data = { checks: [{ title: 'Imagery Mood' }] }

		await expect(
			validateGuidelineCheckKeys({
				collection: { slug: 'guideline-documents' },
				data,
				operation: 'create',
				req: {
					context: { skipGuidelineCheckUniqueness: true },
					payload: { find },
				},
			} as never),
		).resolves.toBe(data)
		expect(find).not.toHaveBeenCalled()
	})
})
