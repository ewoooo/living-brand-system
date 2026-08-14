import { describe, expect, it, vi } from 'vitest'
import { getPublishedTemplate } from './get-published-template.service'

vi.mock('@/features/template-core/repositories/published-template.payload.repository', () => ({
	findPublishedTemplate: vi.fn().mockResolvedValue({
		id: 3,
		name: '명함',
		updatedAt: '2026-08-01T00:00:00.000Z',
		html: '<p data-node-id="name">이름</p><div data-node-id="photo"></div><p data-node-id="caption">캡션</p>',
		overrides: {
			name: {
				text: '기본',
				input: { label: '이름', maxLength: 20, aiInstruction: '영문 이름만' },
			},
			photo: { imageInput: { profileId: 7 }, imageColorize: { line: '#112233' } },
			caption: { text: '고정' },
		},
		controllerRestrictions: {
			controls: [{ controlId: 'background.type', availability: 'readonly' }],
		},
		width: 1200,
		height: 800,
	}),
}))

describe('getPublishedTemplate', () => {
	it('스튜디오가 쓰는 노드 설정만 남기고 저작 내부 정보를 SSR에 노출하지 않는다', async () => {
		const template = await getPublishedTemplate('summer-poster')

		expect(template?.nodeConfigs).toEqual({
			name: { input: { label: '이름', maxLength: 20 } },
			photo: { imageInput: { profileId: 7 }, imageColorize: { line: '#112233' } },
		})
		expect(template?.controllerRestrictions).toEqual({
			controls: [{ controlId: 'background.type', availability: 'readonly' }],
		})
		expect(JSON.stringify(template)).not.toContain('aiInstruction')
	})
})
