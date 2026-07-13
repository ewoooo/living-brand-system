'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageGenerationResults } from '@/features/image-generation/components/image-generation-results'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'
import { IMAGE_SCENES } from '@/features/image-generation/presets'

// 제품(프롬프트) + 씬 선택 → /api/image → 후보 그리드(택1·다운로드). 프롬프트 합성·생성은 라우트/서비스 소유.
// 결과에 실제 합성 프롬프트·적용 씬을 함께 노출해 품질을 디버깅할 수 있게 한다(R&D 방식).

export function ImageGenerator() {
	const [prompt, setPrompt] = useState('')
	const [sceneId, setSceneId] = useState('auto')
	const [count, setCount] = useState(2)
	const { error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	const scene = IMAGE_SCENES.find((s) => s.id === sceneId)

	function requestGeneration() {
		void generate({ count, prompt, sceneId })
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
					<Button onClick={requestGeneration} disabled={loading || !prompt.trim()}>
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
						<button type="button" onClick={requestGeneration} className="underline">
							다시 시도
						</button>
					</p>
				)}
			</div>

			<ImageGenerationResults
				loading={loading}
				onSelect={setSelected}
				requested={requested}
				result={result}
				selected={selected}
			/>
		</section>
	)
}
