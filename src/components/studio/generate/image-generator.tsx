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
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
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
	const [profile, setProfile] = useState<number | undefined>(initialProfileId ?? profiles[0]?.id)
	const [count, setCount] = useState(2)
	const { error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	function requestGeneration() {
		if (!profile) return
		void generate({
			count,
			prompt,
			profileId: profile,
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
						<Field>
							<FieldLabel htmlFor="image-prompt">
								프롬프트{' '}
								<span className="text-destructive" aria-hidden>
									*
								</span>
							</FieldLabel>
							<Textarea
								id="image-prompt"
								value={prompt}
								onChange={(event) => setPrompt(event.target.value)}
								placeholder="만들 제품이나 장면을 설명하세요"
								aria-describedby="image-prompt-description"
								maxLength={500}
								rows={5}
								className="min-h-28 resize-y"
							/>
							<FieldDescription id="image-prompt-description" className="text-xs">
								프로파일을 선택하면 브랜드 설정과 프롬프트가 자동으로 조합됩니다.
							</FieldDescription>
						</Field>

						<Separator />

						<div className="flex flex-col gap-4">
							<Typography as="h3" size="sm" weight="medium">
								설정
							</Typography>
							<FieldGroup>
								<Field data-disabled={profiles.length === 0}>
									<FieldLabel htmlFor="image-profile">프로파일</FieldLabel>
									<Select
										value={profile ? String(profile) : undefined}
										onValueChange={(value) => setProfile(Number(value))}
										disabled={profiles.length === 0}
									>
										<SelectTrigger id="image-profile" className="w-full">
											<SelectValue placeholder="발행된 프로파일 없음" />
										</SelectTrigger>
										{profiles.length > 0 && (
											<SelectContent>
												<SelectGroup>
													<SelectLabel>
														브랜드 제품컷 프로파일
													</SelectLabel>
													{profiles.map(({ id, name }) => (
														<SelectItem key={id} value={String(id)}>
															{name}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										)}
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor="image-count">생성 장수</FieldLabel>
									<Select
										value={String(count)}
										onValueChange={(value) => setCount(Number(value))}
									>
										<SelectTrigger id="image-count" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{[1, 2, 4, 6].map((amount) => (
													<SelectItem key={amount} value={String(amount)}>
														{amount}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
							</FieldGroup>
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
								<Button
									type="button"
									variant="link"
									size="xs"
									onClick={requestGeneration}
									className="px-0"
								>
									다시 시도
								</Button>
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
							disabled={loading || !profile || !prompt.trim()}
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
