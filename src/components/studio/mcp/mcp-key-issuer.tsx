'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { useMcpKeyIssuance } from '@/features/mcp-access/hooks/use-mcp-key-issuance'

export function McpKeyIssuer() {
	const { copyMessage, copyText, credential, error, issueKey, loading } = useMcpKeyIssuance()
	const codexCommand = credential
		? `export LBS_MCP_API_KEY='${credential.apiKey}'\ncodex mcp add living-brand-system --url '${credential.endpoint}' --bearer-token-env-var LBS_MCP_API_KEY`
		: ''
	const claudeCommand = credential
		? `claude mcp add --transport http living-brand-system --scope user '${credential.endpoint}' --header "Authorization: Bearer ${credential.apiKey}"`
		: ''

	return (
		<Card>
			<CardHeader>
				<CardTitle>MCP 연결</CardTitle>
				<CardDescription>외부 MCP 클라이언트에서 사용할 키를 발급합니다.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{credential ? (
					<>
						<Typography size="sm" tone="muted">
							이 키는 지금만 표시됩니다. 닫기 전에 복사해 주세요.
						</Typography>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="mcp-endpoint">Endpoint</FieldLabel>
								<Input id="mcp-endpoint" readOnly value={credential.endpoint} />
							</Field>
							<Field>
								<FieldLabel htmlFor="mcp-api-key">Bearer key</FieldLabel>
								<InputGroup>
									<InputGroupInput
										id="mcp-api-key"
										readOnly
										value={credential.apiKey}
									/>
									<InputGroupAddon align="inline-end">
										<InputGroupButton
											variant="outline"
											onClick={() =>
												copyText(credential.apiKey, '키를 복사했습니다.')
											}
										>
											복사
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</Field>
							<Field>
								<FieldLabel htmlFor="codex-mcp-command">Codex CLI</FieldLabel>
								<FieldDescription>
									붙여넣은 터미널에서 Codex를 실행하세요. 새 터미널에서는
									LBS_MCP_API_KEY를 다시 설정해야 합니다.
								</FieldDescription>
								<Textarea id="codex-mcp-command" readOnly value={codexCommand} />
								<Button
									type="button"
									variant="outline"
									className="self-start"
									onClick={() =>
										copyText(codexCommand, 'Codex 등록 명령을 복사했습니다.')
									}
								>
									Codex 명령 복사
								</Button>
							</Field>
							<Field>
								<FieldLabel htmlFor="claude-mcp-command">Claude Code</FieldLabel>
								<FieldDescription>
									사용자 범위에 등록되어 모든 프로젝트에서 사용할 수 있습니다.
								</FieldDescription>
								<Textarea id="claude-mcp-command" readOnly value={claudeCommand} />
								<Button
									type="button"
									variant="outline"
									className="self-start"
									onClick={() =>
										copyText(
											claudeCommand,
											'Claude Code 등록 명령을 복사했습니다.',
										)
									}
								>
									Claude Code 명령 복사
								</Button>
							</Field>
						</FieldGroup>
						<Typography size="sm" tone="muted">
							명령에는 비밀 키가 포함됩니다. 공유 저장소나 문서에 붙여넣지 마세요.
						</Typography>
						<Typography aria-live="polite" size="sm" tone="muted">
							{copyMessage}
						</Typography>
					</>
				) : (
					<Button type="button" disabled={loading} onClick={issueKey}>
						{loading ? '발급 중…' : 'MCP 키 발급'}
					</Button>
				)}
				{error && (
					<Typography role="alert" size="sm" tone="destructive">
						{error}
					</Typography>
				)}
			</CardContent>
		</Card>
	)
}
