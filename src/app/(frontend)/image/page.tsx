'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// ponytail: 프로바이더 미연동 상태의 껍데기 페이지. UI 흐름(입력→생성→그리드)만 먼저.
// 실제 생성은 /api/image가 placeholder를 돌려주고, 나중에 그 라우트만 실 프로바이더로 교체.

export default function ImagePage() {
	const [prompt, setPrompt] = useState('')
	const [count, setCount] = useState(4)
	const [images, setImages] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function generate() {
		if (!prompt.trim() || loading) return
		setLoading(true)
		setError(null)
		try {
			const res = await fetch('/api/image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, count }),
			})
			if (!res.ok) throw new Error(`생성 실패 (${res.status})`)
			const data = (await res.json()) as { images: string[] }
			setImages(data.images)
		} catch (err) {
			setError(err instanceof Error ? err.message : '알 수 없는 오류')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex w-full max-w-[1250px] flex-col px-8 py-10">
			<header className="mb-8">
				<hgroup className="mb-4">
					<h2 className="pb-1 text-muted-foreground text-xl">생성하기</h2>
					<h1 className="text-3xl">이미지 생성</h1>
				</hgroup>
				<p className="mb-4 text-muted-foreground">
					프롬프트를 입력하면 후보 이미지를 여러 장 생성합니다. 마음에 드는 것을 골라
					사용하세요. <wbr />
					(현재 프로바이더 미연동 — placeholder 표시)
				</p>
			</header>

			<div className="mb-8 flex flex-col gap-3">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="예: 미니멀한 브랜드 명함 목업, 밝은 배경"
					rows={3}
					className="w-full resize-y rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
				/>
				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-muted-foreground text-sm">
						장수
						<select
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
							className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
						>
							{[1, 2, 4, 6].map((n) => (
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
				{error && <p className="text-red-500 text-sm">{error}</p>}
			</div>

			{images.length > 0 && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
					{images.map((src, i) => (
						// biome-ignore lint/performance/noImgElement: placeholder 미리보기, 최적화 불필요
						<img
							key={i}
							src={src}
							alt={`생성 결과 ${i + 1}`}
							className="w-full rounded-md border border-neutral-200 dark:border-neutral-800"
						/>
					))}
				</div>
			)}
		</div>
	)
}
