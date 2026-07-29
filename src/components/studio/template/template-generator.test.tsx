import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PublishedHtmlTemplate } from '@/features/template-create/services/get-published-template.service'
import { TemplateGenerator } from './template-generator'

const mocks = vi.hoisted(() => ({ exportTemplate: vi.fn() }))

vi.mock('@/features/template-export/hooks/use-template-export', () => ({
	useTemplateExport: () => ({
		exporting: null,
		exportError: null,
		exportTemplate: mocks.exportTemplate,
	}),
}))

const template: PublishedHtmlTemplate = {
	kind: 'html',
	id: 1,
	name: '테스트 템플릿',
	html: '<div>미리보기</div>',
	nodeConfigs: {},
	width: 400,
	height: 300,
	templateVersion: '2026-07-29T00:00:00.000Z',
}

describe('TemplateGenerator', () => {
	afterEach(cleanup)

	it('공통 Studio 작업대에서 템플릿을 내보낸다', () => {
		const { container } = render(<TemplateGenerator template={template} />)

		expect(container.querySelector('[data-slot="studio-workspace"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-controller"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-canvas"]')).not.toBeNull()

		fireEvent.click(screen.getByRole('button', { name: 'PNG로 내보내기' }))

		expect(mocks.exportTemplate).toHaveBeenCalledWith('png')
	})
})
