'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateTexts } from '../services/generate-text.client'

// 프롬프트(+선택 제약) → 텍스트 후보 목록(복사). 생성·HTTP 계약은 라우트/클라이언트 서비스가 소유.

export function TextGenerator() {
	const [prompt, setPrompt] = useState('')
	const [rule, setRule] = useState('')
	const [count, setCount] = useState(3)
	const [texts, setTexts] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [copied, setCopied] = useState<number | null>(null)

	async function generate() {
		if (!prompt.trim() || loading) return
		setLoading(true)
		setError(null)
		setCopied(null)
		try {
			setTexts(await generateTexts({ prompt, rule: rule.trim() || undefined, count }))
		} catch (err) {
			console.error(err)
			setError('텍스트 생성에 실패했어요. 잠시 후 다시 시도해 주세요.')
		} finally {
			setLoading(false)
		}
	}

	async function copy(text: string, index: number) {
		await navigator.clipboard.writeText(text)
		setCopied(index)
	}

	return (
		<section className="flex flex-col">
			<hgroup className="mb-4">
				<h2 className="text-2xl">텍스트 생성</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					무엇을 쓸지 설명하면 후보를 여러 개 만들어 줍니다. 제약(예: “명사형 행사
					제목”)을 달면 그 규칙을 지켜 생성합니다.
				</p>
			</hgroup>

			<div className="mb-6 flex flex-col gap-3">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="쓸 내용 (예: 신제품 허브 세럼 런칭 문구)"
					aria-label="생성할 텍스트 설명"
					maxLength={500}
					rows={3}
					className="w-full resize-y rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
				/>
				<input
					value={rule}
					onChange={(e) => setRule(e.target.value)}
					placeholder="제약 (선택 — 예: 12자 이내, 명사형, 존댓말)"
					aria-label="제약"
					maxLength={200}
					className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
				/>
				<div className="flex flex-wrap items-center gap-3">
					<label className="flex items-center gap-2 text-muted-foreground text-sm">
						개수
						<select
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
							className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
						>
							{[1, 3, 5].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</label>
					<Button onClick={generate} disabled={loading || !prompt.trim()}>
						{loading ? '생성 중…' : '생성'}
					</Button>
				</div>
				{error && (
					<p role="alert" className="flex items-center gap-2 text-red-500 text-sm">
						{error}
						<button type="button" onClick={generate} className="underline">
							다시 시도
						</button>
					</p>
				)}
			</div>

			<div aria-live="polite" aria-busy={loading}>
				{!loading && texts.length > 0 && (
					<ul className="flex flex-col gap-2">
						{texts.map((text, i) => (
							<li
								key={text}
								className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
							>
								<span className="whitespace-pre-wrap">{text}</span>
								<button
									type="button"
									onClick={() => copy(text, i)}
									className="shrink-0 text-muted-foreground text-xs underline"
								>
									{copied === i ? '복사됨' : '복사'}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	)
}
