'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageGenerationResults } from '@/features/image-generation/components/image-generation-results'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'

// 제품(프롬프트) + 프로파일 선택 → /api/image → 후보 그리드(택1·다운로드). 정규화·생성은 라우트/서비스 소유.

export function ImageGenerator({
	profiles,
	initialProfileId,
}: {
	profiles: { id: number; name: string }[]
	initialProfileId?: number
}) {
	const [prompt, setPrompt] = useState('')
	const [profile, setProfile] = useState<number | 'free'>(
		initialProfileId ?? profiles[0]?.id ?? 'free',
	)
	const [count, setCount] = useState(2)
	const { error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	function requestGeneration() {
		void generate({
			count,
			prompt,
			...(profile === 'free' ? {} : { profileId: profile }),
		})
	}

	return (
		<section className="flex flex-col">
			<hgroup className="mb-4">
				<h2 className="font-body text-xl font-normal">이미지 생성</h2>
				<p className="mt-1 font-body text-sm font-normal text-muted-foreground">
					브랜드 제품컷은 프로파일을 고르면 유저 요청에 맞는 프롬프트가 자동으로
					조합됩니다. 제품컷이 아닌 이미지는 자유 생성 모드로 프롬프트를 그대로
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
						profile === 'free'
							? '만들 이미지 (자유 생성 — 예: 봄 느낌의 추상 배경, 허브 텍스처)'
							: '만들 제품 (예: 허브 세럼 앰플, 블루 크림 튜브)'
					}
					aria-label="만들 이미지 설명"
					maxLength={500}
					rows={3}
					className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm font-normal"
				/>
				<div className="flex flex-wrap items-center gap-3">
					<label className="flex items-center gap-2 font-body text-sm font-normal text-muted-foreground">
						프로파일
						<select
							value={profile}
							onChange={(event) => {
								setProfile(
									event.currentTarget.value === 'free'
										? 'free'
										: Number(event.currentTarget.value),
								)
							}}
							className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
						>
							<option value="free">자유 생성 (브랜드 스타일 없음)</option>
							<optgroup label="브랜드 제품컷 프로파일">
								{profiles.length === 0 ? (
									<option disabled>발행된 프로파일 없음</option>
								) : (
									profiles.map(({ id, name }) => (
										<option key={id} value={id}>
											{name}
										</option>
									))
								)}
							</optgroup>
						</select>
					</label>
					<label className="flex items-center gap-2 font-body text-sm font-normal text-muted-foreground">
						장수
						<select
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
							className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
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
				{error && (
					<p
						role="alert"
						className="flex items-center gap-2 font-body text-sm font-normal text-destructive"
					>
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
