import { afterEach, expect, test, vi } from 'vitest'

import { requestPublishedImageProfiles } from './generate-image.client'

afterEach(() => {
	vi.unstubAllGlobals()
})

// 어드민 허용 목록 UI가 이 함수를 쓴다 — draft가 섞이면 "전부 켜짐 → 전부 허용" 축약 판정이
// published 모집단과 어긋나므로, 요청 자체가 published로 좁혀졌는지를 고정한다.
test('published 상태로 좁혀 이미지 프로파일을 조회한다', async () => {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		json: () => Promise.resolve({ docs: [{ id: 1, name: 'A' }] }),
	})
	vi.stubGlobal('fetch', fetchMock)

	const docs = await requestPublishedImageProfiles()

	expect(docs).toEqual([{ id: 1, name: 'A' }])
	expect(String(fetchMock.mock.calls[0]?.[0])).toContain('where[_status][equals]=published')
})
