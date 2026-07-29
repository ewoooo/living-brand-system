'use client'

import { Image as ImageIcon } from '@carbon/icons-react'
import { useState } from 'react'
import { ImageGenerationResults } from '@/components/studio/generate/image-generation-results'
import { StudioWorkspace } from '@/components/studio/studio-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { useImageGeneration } from '@/features/generate-image/hooks/use-image-generation'

// 제품(프롬프트) + 프로파일 선택 → 생성 API → 후보 그리드(택1·다운로드). 정규화·생성은 라우트/서비스 소유.

const EXAMPLE_PROMPTS = [
	'신제품을 위한 깨끗한 스튜디오 제품 이미지',
	'브랜드 캠페인을 위한 자연광 라이프스타일 이미지',
	'가이드 배경에 사용할 추상적인 자연 텍스처',
] as const

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
		<StudioWorkspace
			controller={
				<Card className="min-h-0 gap-0 py-0 lg:h-full">
					<CardHeader className="border-b border-border py-4">
						<CardTitle>생성 컨트롤러</CardTitle>
						<Typography size="xs" tone="muted">
							이미지 설명과 생성 설정을 입력하세요.
						</Typography>
					</CardHeader>

					<CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="image-prompt">
								프롬프트{' '}
								<span className="text-destructive" aria-hidden>
									*
								</span>
							</Label>
							<Textarea
								id="image-prompt"
								value={prompt}
								onChange={(event) => setPrompt(event.target.value)}
								placeholder={
									profile === 'free'
										? '만들 이미지를 설명하세요'
										: '만들 제품이나 장면을 설명하세요'
								}
								aria-label="프롬프트"
								aria-describedby="image-prompt-description"
								maxLength={500}
								rows={5}
								className="min-h-28 resize-y"
							/>
							<Typography id="image-prompt-description" size="xs" tone="muted">
								프로파일을 선택하면 브랜드 설정과 프롬프트가 자동으로 조합됩니다.
							</Typography>
						</div>

						<Separator />

						<div className="flex flex-col gap-4">
							<Typography as="h3" size="sm" weight="medium">
								설정
							</Typography>
							<div className="flex flex-col gap-2">
								<Label htmlFor="image-profile">프로파일</Label>
								<select
									id="image-profile"
									value={profile}
									onChange={(event) => {
										setProfile(
											event.currentTarget.value === 'free'
												? 'free'
												: Number(event.currentTarget.value),
										)
									}}
									className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="image-count">생성 장수</Label>
								<select
									id="image-count"
									value={count}
									onChange={(event) => setCount(Number(event.target.value))}
									className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								>
									{[1, 2, 4, 6].map((amount) => (
										<option key={amount} value={amount}>
											{amount}
										</option>
									))}
								</select>
							</div>
						</div>

						<Typography size="xs" tone="muted">
							현재 미리보기 엔진은 생성에 최대 1~2분이 걸릴 수 있습니다.
						</Typography>

						{error && (
							<div
								role="alert"
								className="flex flex-wrap items-center gap-2 text-xs text-destructive"
							>
								{error}
								<button
									type="button"
									onClick={requestGeneration}
									className="underline"
								>
									다시 시도
								</button>
							</div>
						)}
					</CardContent>

					<CardFooter className="flex-col items-stretch gap-2 border-t border-border py-4">
						{result?.model && (
							<Typography size="xs" tone="muted" className="text-right">
								{result.model}
							</Typography>
						)}
						<Button
							type="button"
							size="lg"
							className="w-full"
							onClick={requestGeneration}
							disabled={loading || !prompt.trim()}
						>
							{loading ? '생성 중…' : '이미지 생성'}
						</Button>
					</CardFooter>
				</Card>
			}
		>
			{!loading && !result ? (
				<EmptyCanvas onSelectExample={setPrompt} />
			) : (
				<ImageGenerationResults
					loading={loading}
					onSelect={setSelected}
					requested={requested}
					result={result}
					selected={selected}
				/>
			)}
		</StudioWorkspace>
	)
}

function EmptyCanvas({ onSelectExample }: { onSelectExample: (prompt: string) => void }) {
	return (
		<Empty className="h-full border-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<ImageIcon aria-hidden />
				</EmptyMedia>
				<EmptyTitle>브랜드 이미지를 생성하세요</EmptyTitle>
				<EmptyDescription>
					왼쪽 컨트롤러에 프롬프트를 입력하거나 예시로 시작할 수 있습니다.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent className="max-w-2xl">
				<Typography size="xs" weight="medium">
					예시로 시작하기
				</Typography>
				<div className="grid w-full gap-2 md:grid-cols-3">
					{EXAMPLE_PROMPTS.map((example) => (
						<Button
							key={example}
							type="button"
							variant="muted"
							className="h-auto min-h-16 justify-start whitespace-normal px-3 py-3 text-left"
							onClick={() => onSelectExample(example)}
						>
							{example}
						</Button>
					))}
				</div>
			</EmptyContent>
		</Empty>
	)
}
