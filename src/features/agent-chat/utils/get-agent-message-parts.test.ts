import { describe, expect, it } from 'vitest'
import { getAgentTemplateAttachments } from './get-agent-message-parts'

describe('getAgentTemplateAttachments', () => {
	it('JSON 제거 전에 저장된 첨부는 건너뛰고 HTML 첨부만 반환한다', () => {
		const attachments = getAgentTemplateAttachments({
			id: 'message-1',
			role: 'assistant',
			parts: [
				{
					type: 'tool-prepareTemplateImage',
					state: 'output-available',
					toolCallId: 'legacy',
					output: { type: 'template-image', templateId: 1, template: {}, values: {} },
				},
				{
					type: 'tool-prepareTemplateImage',
					state: 'output-available',
					toolCallId: 'html',
					output: {
						type: 'template-image',
						kind: 'html',
						templateId: 2,
						name: 'HTML template',
						html: '<div id="__stage"></div>',
						width: 100,
						height: 100,
						values: {},
					},
				},
			],
		} as never)

		expect(attachments).toHaveLength(1)
		expect(attachments[0]?.key).toBe('html')
	})
})
