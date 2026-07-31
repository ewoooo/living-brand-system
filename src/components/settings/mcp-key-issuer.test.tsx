import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { McpKeyIssuer } from './mcp-key-issuer'

describe('McpKeyIssuer', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('발급한 키와 엔드포인트로 Codex와 Claude Code 등록 명령을 만든다', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: async () => ({
					apiKey: 'test-key',
					endpoint: 'https://stage.example.com/api/mcp',
					id: 1,
				}),
				ok: true,
				status: 201,
			}),
		)

		render(<McpKeyIssuer />)
		fireEvent.click(screen.getByRole('button', { name: 'MCP 키 발급' }))

		expect(await screen.findByLabelText('Codex 등록 명령')).toHaveValue(
			"export LBS_MCP_API_KEY='test-key'\n" +
				"codex mcp add living-brand-system --url 'https://stage.example.com/api/mcp' --bearer-token-env-var LBS_MCP_API_KEY",
		)
		expect(screen.getByLabelText('Claude Code 등록 명령')).toHaveValue(
			'claude mcp add --transport http living-brand-system --scope user \'https://stage.example.com/api/mcp\' --header "Authorization: Bearer test-key"',
		)
	})
})
