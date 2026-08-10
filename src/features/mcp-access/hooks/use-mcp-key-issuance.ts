'use client'

import { useState } from 'react'
import { routes } from '@/lib/routes'
import { type McpApiKeyCredential, requestMcpApiKey } from '../services/issue-mcp-api-key.client'

const ISSUE_ERROR_MESSAGE = 'MCP 키를 발급하지 못했습니다.'

/**
 * MCP 키 발급 화면 상태(발급 결과·로딩·에러·복사 피드백)를 소유한다.
 * 브라우저 fetch는 issue-mcp-api-key.client가 담당하며, 이 훅은 그 결과를 해석해
 * 미인증이면 로그인으로 리다이렉트하고, 그 외에는 화면 상태로 반영한다.
 */
export function useMcpKeyIssuance() {
	const [credential, setCredential] = useState<McpApiKeyCredential | null>(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [copyMessage, setCopyMessage] = useState('')

	async function issueKey() {
		setError('')
		setLoading(true)
		const result = await requestMcpApiKey()
		setLoading(false)

		if (result.status === 'unauthorized') {
			window.location.assign(`/admin/login?redirect=${encodeURIComponent(routes.studio.mcp)}`)
			return
		}
		if (result.status === 'error') {
			setError(ISSUE_ERROR_MESSAGE)
			return
		}
		setCredential(result.credential)
	}

	async function copyText(value: string, message: string) {
		await navigator.clipboard.writeText(value)
		setCopyMessage(message)
	}

	return { copyMessage, copyText, credential, error, issueKey, loading }
}
