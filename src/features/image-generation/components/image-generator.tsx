'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IMAGE_SCENES } from '@/features/image-generation/presets'

// 제품(프롬프트) + 씬 선택 → /api/image → 후보 그리드(택1·다운로드). 프롬프트 합성·생성은 라우트/서비스 소유.
// 결과에 실제 합성 프롬프트·적용 씬을 함께 노출해 품질을 디버깅할 수 있게 한다(R&D 방식).

type ImageResult = { images: string[]; prompt: string; sceneId: string }

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5']

export function ImageGenerator() {
	const [prompt, setPrompt] = useState('')
	const [sceneId, setSceneId] = useState('auto')
	const [count, setCount] = useState(2)
	const [result, setResult] = useState<ImageResult | null>(null)
	const [requested, setRequested] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const scene = IMAGE_SCENES.find((s) => s.id === sceneId)
	const images = result?.images ?? []

	async function generate() {
		if (!prompt.trim() || loading) return
		setLoading(true)
		setError(null)
		setSelected(null)
		setRequested(count)
		try {
			const res = await fetch('/api/image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt, count, sceneId }),
			})
			if (!res.ok) throw new Error(`생성 실패 (${res.status})`)
			setResult((await res.json()) as ImageResult)
		} catch (err) {
			console.error(err)
			setError(
				'이미지 생성에 실패했어요. 무료 엔진이 느려 그럴 수 있으니 다시 시도해 주세요.',
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className="flex flex-col">
			<hgroup className="mb-4">
				<h2 className="text-2xl">이미지 생성</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					브랜드 제품컷은 씬(환경·구성)을 고르면 브랜드 톤·조명·구도가 자동으로
					더해집니다. 제품컷이 아닌 이미지는 자유 생성 모드로 프롬프트를 그대로
					생성하세요. <wbr />
					(정식 엔진 gpt-image-2 연결 대기 중 — 현재는 미리보기용 임시 엔진이라 다소
					느리고 품질이 들쭉날쭉할 수 있어요)
				</p>
			</hgroup>

			<div className="mb-6 flex flex-col gap-3">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={
						sceneId === 'free'
							? '만들 이미지 (자유 생성 — 예: 봄 느낌의 추상 배경, 허브 텍스처)'
							: '만들 제품 (예: 허브 세럼 앰플, 블루 크림 튜브)'
					}
					aria-label="만들 이미지 설명"
					maxLength={500}
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
								{IMAGE_SCENES.map((s) => (
									<option key={s.id} value={s.id}>
										{s.label}
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
				{scene && (
					<p className="text-muted-foreground text-xs">
						씬 구성: {scene.ingredient} · {scene.moodAccent}
					</p>
				)}
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
				{loading && (
					<div className="flex flex-col gap-3">
						<p className="text-muted-foreground text-sm">
							생성 중… 무료 서버라 최대 1~2분 걸릴 수 있어요.
						</p>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
							{SKELETON_KEYS.slice(0, requested).map((k) => (
								<div
									key={k}
									className="aspect-[3/4] animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800"
								/>
							))}
						</div>
					</div>
				)}

				{!loading && images.length > 0 && (
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
						{images.length < requested && (
							<p className="text-muted-foreground text-sm">
								요청 {requested}장 중 {images.length}장 생성됨 (일부는 무료 서버
								지연으로 실패)
							</p>
						)}
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
							{images.map((src, i) => (
								<div key={src} className="flex flex-col gap-1">
									<button
										type="button"
										onClick={() => setSelected(i)}
										aria-pressed={selected === i}
										className={`overflow-hidden rounded-md border-2 transition-colors ${
											selected === i
												? 'border-blue-500'
												: 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-800'
										}`}
									>
										{/* biome-ignore lint/performance/noImgElement: 미리보기, 최적화 불필요 */}
										<img
											src={src}
											alt={`생성 결과 ${i + 1}`}
											className="w-full"
										/>
									</button>
									<a
										href={src}
										target="_blank"
										rel="noreferrer"
										className="text-muted-foreground text-xs underline"
									>
										원본 보기
									</a>
								</div>
							))}
						</div>
						{result && (
							<div className="text-muted-foreground text-sm">
								적용된 씬: {resultSceneLabel(result.sceneId)}
								<details className="mt-1">
									<summary className="cursor-pointer">생성 프롬프트 보기</summary>
									<p className="mt-1 whitespace-pre-wrap text-xs">
										{result.prompt}
									</p>
								</details>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	)
}

function resultSceneLabel(sceneId: string) {
	if (sceneId === 'free') return '자유 생성 (브랜드 스타일 없음)'
	return IMAGE_SCENES.find((s) => s.id === sceneId)?.label ?? '자동 선택'
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
