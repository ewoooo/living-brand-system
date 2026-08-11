'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useImageStudio } from '@/features/image-studio/hooks/use-image-studio'

// 컨트롤러: 편집 계약(config)이 허용하는 조작만 그리고, 값은 컨텍스트에만 쓴다 — 캔버스를 모른다.
export function ImageSidebar() {
	const { config, profiles, prompt, generation, results } = useImageStudio()
	const { batch } = config.generateOptions

	return (
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
						value={prompt.value}
						onChange={(event) => prompt.setValue(event.target.value)}
						placeholder="만들 제품이나 장면을 설명하세요"
						aria-describedby="image-prompt-description"
						maxLength={config.prompt.maxLength}
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
						<Field>
							<FieldLabel htmlFor="image-profile">프로파일</FieldLabel>
							<Select
								value={String(config.profileId)}
								onValueChange={(value) => profiles.select(Number(value))}
							>
								<SelectTrigger id="image-profile" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>브랜드 제품컷 프로파일</SelectLabel>
										{profiles.options.map(({ id, name }) => (
											<SelectItem key={id} value={String(id)}>
												{name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>

						<Field>
							<FieldLabel htmlFor="image-count">생성 장수</FieldLabel>
							<Select
								value={String(generation.batch)}
								onValueChange={(value) => generation.setBatch(Number(value))}
							>
								<SelectTrigger id="image-count" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{batch.options.map((amount) => (
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

				{generation.error && (
					<div
						role="alert"
						className="flex flex-wrap items-center gap-2 text-xs text-destructive"
					>
						{generation.error}
						<Button
							type="button"
							variant="link"
							size="xs"
							onClick={generation.run}
							className="px-0"
						>
							다시 시도
						</Button>
					</div>
				)}
			</CardContent>

			<CardFooter className="flex-col items-stretch gap-2 border-t border-border py-4">
				{results.result?.model && (
					<Typography size="xs" tone="muted" className="text-right">
						{results.result.model}
					</Typography>
				)}
				<Button
					type="button"
					size="lg"
					className="w-full"
					onClick={generation.run}
					disabled={generation.busy || !prompt.value.trim()}
				>
					{generation.busy ? '생성 중…' : '이미지 생성'}
				</Button>
			</CardFooter>
		</Card>
	)
}
