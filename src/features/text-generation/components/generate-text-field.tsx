'use client'

import { useState } from 'react'
import { generateOneText } from '../services/generate-one-text.client'

/**
 * 대상 텍스트박스 하나를 AI로 채우는 최소 위젯: 프롬프트 입력 + 생성 버튼.
 * 생성 결과를 onGenerated로 넘긴다(호출부가 값/placeholder 등 원하는 곳에 반영).
 * admin(Payload)·frontend 어디서나 쓰도록 inline 스타일만 쓴다.
 */
export function GenerateTextField({
	label = 'AI 생성',
	defaultPrompt = '',
	onGenerated,
}: {
	label?: string
	defaultPrompt?: string
	onGenerated: (text: string) => void
}) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)

	async function run() {
		if (loading) return
		setLoading(true)
		const text = await generateOneText(prompt.trim() || defaultPrompt || '짧은 텍스트')
		if (text) onGenerated(text)
		setLoading(false)
	}

	return (
		<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
			<input
				value={prompt}
				onChange={(e) => setPrompt(e.target.value)}
				placeholder="AI 프롬프트 (예: 봄 세일 제목)"
				style={{
					flex: 1,
					minWidth: 0,
					fontSize: 12,
					padding: '4px 8px',
					border: '1px solid var(--border, #d4d4d4)',
					borderRadius: 6,
					background: 'transparent',
					color: 'inherit',
				}}
			/>
			<button
				type="button"
				onClick={run}
				disabled={loading}
				style={{
					fontSize: 12,
					padding: '4px 10px',
					border: '1px solid var(--border, #d4d4d4)',
					borderRadius: 6,
					cursor: loading ? 'default' : 'pointer',
					whiteSpace: 'nowrap',
					background: 'transparent',
					color: 'inherit',
					opacity: loading ? 0.6 : 1,
				}}
			>
				{loading ? '생성 중…' : label}
			</button>
		</div>
	)
}
