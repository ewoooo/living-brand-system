'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { routes } from '@/lib/routes'

interface McpCredential {
	apiKey: string
	endpoint: string
	id: number
}

export function McpKeyIssuer() {
	const [credential, setCredential] = useState<McpCredential | null>(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [copied, setCopied] = useState(false)

	async function issueKey() {
		setError('')
		setLoading(true)
		const response = await fetch('/api/mcp-key', { method: 'POST' }).catch(() => null)
		setLoading(false)

		if (response?.status === 401) {
			window.location.assign(
				`/admin/login?redirect=${encodeURIComponent(routes.mcpSettings)}`,
			)
			return
		}
		if (!response?.ok) {
			setError('MCP 키를 발급하지 못했습니다.')
			return
		}

		setCredential((await response.json()) as McpCredential)
	}

	async function copyKey() {
		if (!credential) return
		await navigator.clipboard.writeText(credential.apiKey)
		setCopied(true)
	}

	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>MCP 연결</CardTitle>
				<CardDescription>외부 MCP 클라이언트에서 사용할 키를 발급합니다.</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				{credential ? (
					<>
						<p className="text-sm text-muted-foreground">
							이 키는 지금만 표시됩니다. 닫기 전에 복사해 주세요.
						</p>
						<div className="grid gap-1">
							<label className="text-sm" htmlFor="mcp-endpoint">
								Endpoint
							</label>
							<Input id="mcp-endpoint" readOnly value={credential.endpoint} />
						</div>
						<div className="grid gap-1">
							<label className="text-sm" htmlFor="mcp-api-key">
								Bearer key
							</label>
							<div className="flex gap-2">
								<Input id="mcp-api-key" readOnly value={credential.apiKey} />
								<Button type="button" variant="outline" onClick={copyKey}>
									복사
								</Button>
							</div>
							<p aria-live="polite" className="text-sm text-muted-foreground">
								{copied ? '복사했습니다.' : ''}
							</p>
						</div>
					</>
				) : (
					<Button type="button" disabled={loading} onClick={issueKey}>
						{loading ? '발급 중…' : 'MCP 키 발급'}
					</Button>
				)}
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
