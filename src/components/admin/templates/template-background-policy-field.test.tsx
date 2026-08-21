import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplateBackgroundPolicyField } from './template-background-policy-field'

const payloadForm = vi.hoisted(() => ({
	setValue: vi.fn(),
	value: undefined as unknown,
}))

vi.mock('@payloadcms/ui', () => ({
	FieldDescription: ({ description }: { description: string }) =>
		createElement('p', null, description),
	FieldLabel: ({ label }: { label: string }) => createElement('legend', null, label),
	useField: () => ({
		disabled: false,
		setValue: payloadForm.setValue,
		value: payloadForm.value,
	}),
}))

// requestPublishedImageProfiles·fetchGraphicStudioConfigs는 fetch를 쓴다 — 이 테스트는 형식
// 토글의 disabled 가드만 검증하므로 실제 네트워크를 태우지 않고 빈 목록으로 고정한다.
vi.mock('@/features/image-generation/services/generate-image.client', () => ({
	requestPublishedImageProfiles: () => Promise.resolve([]),
}))
vi.mock('@/features/graphic-generation/services/list-graphic-studio-configs.client', () => ({
	fetchGraphicStudioConfigs: () => Promise.resolve([]),
}))

afterEach(() => {
	cleanup()
	payloadForm.setValue.mockClear()
	payloadForm.value = undefined
})

describe('TemplateBackgroundPolicyField', () => {
	it('형식이 하나만 켜져 있으면 그 버튼은 disabled다', () => {
		payloadForm.value = { types: ['color'] }
		render(createElement(TemplateBackgroundPolicyField, { path: 'backgroundPolicy' } as never))

		expect(screen.getByRole('button', { name: '색' })).toBeDisabled()
	})

	it('형식이 둘 이상 켜져 있으면 disabled가 아니다', () => {
		payloadForm.value = { types: ['color', 'image'] }
		render(createElement(TemplateBackgroundPolicyField, { path: 'backgroundPolicy' } as never))

		expect(screen.getByRole('button', { name: '색' })).not.toBeDisabled()
		expect(screen.getByRole('button', { name: '이미지' })).not.toBeDisabled()
	})
})
