'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
	const [copyMessage, setCopyMessage] = useState('')
	const codexCommand = credential
		? `export LBS_MCP_API_KEY='${credential.apiKey}'\ncodex mcp add living-brand-system --url '${credential.endpoint}' --bearer-token-env-var LBS_MCP_API_KEY`
		: ''
	const claudeCommand = credential
		? `claude mcp add --transport http living-brand-system --scope user '${credential.endpoint}' --header "Authorization: Bearer ${credential.apiKey}"`
		: ''

	async function issueKey() {
		setError('')
		setLoading(true)
		const response = await fetch('/api/mcp-key', { method: 'POST' }).catch(() => null)
		setLoading(false)

		if (response?.status === 401) {
			window.location.assign(`/admin/login?redirect=${encodeURIComponent(routes.studio.mcp)}`)
			return
		}
		if (!response?.ok) {
			setError('MCP 키를 발급하지 못했습니다.')
			return
		}

		setCredential((await response.json()) as McpCredential)
	}

	async function copyText(value: string, message: string) {
		await navigator.clipboard.writeText(value)
		setCopyMessage(message)
	}

	return (
		<Card>
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
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										copyText(credential.apiKey, '키를 복사했습니다.')
									}
								>
									복사
								</Button>
							</div>
						</div>
						<div className="grid gap-2">
							<div>
								<h3 className="font-medium">Codex CLI</h3>
								<p className="text-sm text-muted-foreground">
									붙여넣은 터미널에서 Codex를 실행하세요. 새 터미널에서는
									LBS_MCP_API_KEY를 다시 설정해야 합니다.
								</p>
							</div>
							<label className="sr-only" htmlFor="codex-mcp-command">
								Codex 등록 명령
							</label>
							<Textarea id="codex-mcp-command" readOnly value={codexCommand} />
							<Button
								type="button"
								variant="outline"
								className="justify-self-start"
								onClick={() =>
									copyText(codexCommand, 'Codex 등록 명령을 복사했습니다.')
								}
							>
								Codex 명령 복사
							</Button>
						</div>
						<div className="grid gap-2">
							<div>
								<h3 className="font-medium">Claude Code</h3>
								<p className="text-sm text-muted-foreground">
									사용자 범위에 등록되어 모든 프로젝트에서 사용할 수 있습니다.
								</p>
							</div>
							<label className="sr-only" htmlFor="claude-mcp-command">
								Claude Code 등록 명령
							</label>
							<Textarea id="claude-mcp-command" readOnly value={claudeCommand} />
							<Button
								type="button"
								variant="outline"
								className="justify-self-start"
								onClick={() =>
									copyText(claudeCommand, 'Claude Code 등록 명령을 복사했습니다.')
								}
							>
								Claude Code 명령 복사
							</Button>
						</div>
						<p className="text-sm text-muted-foreground">
							명령에는 비밀 키가 포함됩니다. 공유 저장소나 문서에 붙여넣지 마세요.
						</p>
						<p aria-live="polite" className="text-sm text-muted-foreground">
							{copyMessage}
						</p>
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
