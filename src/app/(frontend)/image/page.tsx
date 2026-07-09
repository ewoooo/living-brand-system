'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IMAGE_SCENES } from '@/features/image-generation/presets'

// 제품(프롬프트) + 씬 선택 → /api/image 호출 → 후보 그리드. 프롬프트 합성·생성은 라우트/서비스가 소유.
// OPENAI_API_KEY 없으면 라우트가 placeholder를 돌려줘 이 UI는 그대로 동작한다.

export default function ImagePage() {
	const [prompt, setPrompt] = useState('')
	const [sceneId, setSceneId] = useState('auto')
	const [count, setCount] = useState(4)
	const [images, setImages] = useState<string[]>([])
	const [selected, setSelected] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function generate() {
		if (!prompt.trim() || loading) return
		setLoading(true)
		setError(null)
		setSelected(null)
		try {
			const res = await fetch('/api/image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, count, sceneId }),
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
					브랜드 제품컷은 씬(환경·구성)을 고르면 브랜드 톤·조명·구도가 자동으로
					더해집니다. 제품컷이 아닌 이미지는 자유 생성 모드로 프롬프트를 그대로
					생성하세요. 후보를 여러 장 만들어 마음에 드는 것을 고르면 됩니다. <wbr />
					(OpenAI 키 미설정 시 placeholder 표시)
				</p>
			</header>

			<div className="mb-8 flex flex-col gap-3">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={
						sceneId === 'free'
							? '만들 이미지 (자유 생성 — 예: 봄 느낌의 추상 배경, 허브 텍스처)'
							: '만들 제품 (예: 허브 세럼 앰플, 블루 크림 튜브)'
					}
					rows={3}
					className="w-full resize-y rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
				/>
				<div className="flex flex-wrap items-center gap-3">
					<label className="flex items-center gap-2 text-muted-foreground text-sm">
						모드
						<select
							value={sceneId}
							onChange={(e) => setSceneId(e.target.value)}
							className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
						>
							<option value="free">자유 생성 (브랜드 스타일 없음)</option>
							<optgroup label="브랜드 제품컷">
								<option value="auto">자동 (입력에서 씬 선택)</option>
								{IMAGE_SCENES.map((scene) => (
									<option key={scene.id} value={scene.id}>
										{scene.label}
									</option>
								))}
							</optgroup>
						</select>
					</label>
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
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Button
							onClick={() =>
								selected !== null && downloadImage(images[selected], selected)
							}
							disabled={selected === null}
						>
							선택한 이미지 다운로드
						</Button>
						<span className="text-muted-foreground text-sm">
							{selected === null
								? '이미지를 클릭해 선택하세요'
								: `${selected + 1}번 선택됨`}
						</span>
					</div>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
						{images.map((src, i) => (
							<button
								type="button"
								key={src}
								onClick={() => setSelected(i)}
								aria-pressed={selected === i}
								className={`overflow-hidden rounded-md border-2 transition-colors ${
									selected === i
										? 'border-blue-500'
										: 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-800'
								}`}
							>
								{/* biome-ignore lint/performance/noImgElement: 미리보기, 최적화 불필요 */}
								<img src={src} alt={`생성 결과 ${i + 1}`} className="w-full" />
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

/** data URI 이미지를 파일로 저장한다 (data:image/…;base64,… 에서 확장자 추출). */
function downloadImage(src: string, index: number) {
	const ext = src.slice(5, src.indexOf(';')).split('/')[1] || 'png'
	const a = document.createElement('a')
	a.href = src
	a.download = `essenherb-image-${index + 1}.${ext}`
	document.body.appendChild(a)
	a.click()
	a.remove()
}
