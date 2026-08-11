'use client'

import { useState } from 'react'
import { Controller } from '@/components/studio/shared/controller'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import type { ImageAspectRatio } from '@/features/generate-image/image-size'
import {
	type ImageProfileOption,
	requestImageGeneration,
} from '@/features/generate-image/services/generate-image.client'
import type { TemplateBackgroundState } from '@/features/template-studio/hooks/use-template-studio'
import type { TemplateBackgroundType } from '@/features/template-studio/template-config'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	type ImageTransformValue,
} from './image-transform-control'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'
const PROMPT_MAX_LENGTH = 500

const BACKGROUND_TYPE_LABELS: Record<TemplateBackgroundType, string> = {
	color: 'Color',
	image: 'Image',
	graphic: 'Graphic',
}

/**
 * 잠긴 colorize 행의 표시값 — 생성 이미지를 물들이는 파라미터이고 캔버스 colorize 경로가
 * 따로 필요하다. 배선되는 시점에 Provider의 배경 상태로 올라간다.
 */
const LOCKED_LINE_COLOR = '#000000'
const LOCKED_COLORIZE_BACKGROUND = '#ffffff'

type BackgroundSectionProps = {
	/** 편집 계약(config)이 이 템플릿에 허용한 배경 종류 — Type 목록이 여기서 나온다. */
	allowedTypes: readonly TemplateBackgroundType[]
	/** 템플릿 캔버스 종횡비(w/h) — 배경 transform 패드가 같은 비율로 그려진다. */
	canvasAspectRatio?: number
	/** 캔버스 박스에서 유도한 생성 비율 — 없으면 프로파일 비율로 생성한다. */
	aspectRatio?: ImageAspectRatio
	/** 발행 프로파일 목록 — Provider가 1회 조회해 이미지 슬롯과 공유한다. null = 로드 중. */
	profiles: ImageProfileOption[] | null
	profilesFailed?: boolean
	/** 배경 세션 상태 — 소유는 Provider(합성에 싣는다). */
	value: TemplateBackgroundState
	onChange: (patch: Partial<TemplateBackgroundState>) => void
}

/**
 * 디자인 SSOT(2:2071 Sidebar State)의 Background 상태 분기 — Type이 하위 컨트롤 세트를 갈아끼운다.
 * Color: 배경색 / Image: Preset(브랜드 이미지 선택)·Generate(프롬프트 생성) + Image Transform /
 * Graphic: 그래픽 종류·색 + Graphic Transform(포지션·가변 두께·시점·각도 — forward-straight 계약과 1:1).
 *
 * 값 소유는 Provider(캔버스 배경으로 합성된다)이고, 프롬프트·생성 중·실패는 여기 런타임 상태다
 * (docs/10 §3.6 — error·busy는 정의가 아니다). compose에 경로가 없는 갈래(Preset 브라우즈,
 * Graphic 전체, colorize 색 행, Image Transform)는 계속 잠가 스테이징한다.
 */
export function BackgroundSection({
	allowedTypes,
	canvasAspectRatio,
	aspectRatio,
	profiles,
	profilesFailed,
	value,
	onChange,
}: BackgroundSectionProps) {
	const { type, imageMode } = value
	const [prompt, setPrompt] = useState('')
	const [generating, setGenerating] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [imageTransform, setImageTransform] =
		useState<ImageTransformValue>(IMAGE_TRANSFORM_DEFAULT)
	// Graphic Transform — 현재 그래픽 기능(forward-straight)이 지원하는 파라미터만 노출한다.
	const [graphicOrigin, setGraphicOrigin] = useState({ x: 0, y: 0 })
	const [variableWeight, setVariableWeight] = useState<'off' | 'on'>('off')
	const [viewpoint, setViewpoint] = useState<'flat' | 'low-angle'>('flat')
	const [angleIntensity, setAngleIntensity] = useState<'weak' | 'medium' | 'strong'>('medium')

	// 디자인에 프로파일 선택 컨트롤이 없다 — 이미지 슬롯과 같은 규칙으로 발행 목록의 첫 항목을 쓴다.
	const profileId = profiles?.[0]?.id

	async function generate() {
		const trimmed = prompt.trim()
		if (!trimmed || !profileId || generating) return
		setGenerating(true)
		setError(null)
		try {
			const result = await requestImageGeneration({
				prompt: trimmed,
				// 배경은 후보 고르기가 없다 — 1장만 생성한다(라우트 기본값에 의존하지 않는다).
				count: 1,
				profileId,
				aspectRatio,
			})
			const generated = result.generatedImages?.[0]
			if (generated) {
				onChange({ image: { url: generated.url, generatedImageId: generated.id } })
			} else {
				setError(GENERATION_ERROR_MESSAGE)
			}
		} catch (requestError) {
			console.error(requestError)
			setError(GENERATION_ERROR_MESSAGE)
		} finally {
			setGenerating(false)
		}
	}

	const visibleError = error ?? (profilesFailed ? '이미지 프로파일을 불러오지 못했습니다.' : null)

	return (
		<>
			<Controller.Group title="Background" collapsible>
				<Controller.Row label="Type">
					<Controller.Select
						options={allowedTypes.map((allowed) => ({
							value: allowed,
							label: BACKGROUND_TYPE_LABELS[allowed],
						}))}
						value={type}
						onChange={(next) => onChange({ type: next as TemplateBackgroundType })}
					/>
				</Controller.Row>

				{type === 'color' && (
					<Controller.ColorRow
						label="Background Color"
						value={value.color ?? '#ffffff'}
						isEmpty={value.color === null}
						onReset={() => onChange({ color: null })}
						onChange={(hex) => onChange({ color: hex })}
					/>
				)}

				{type === 'image' && (
					<>
						<Controller.Row label="Image Type">
							<Controller.Segmented
								aria-label="배경 이미지 방식"
								options={[
									{ value: 'preset', label: 'Preset' },
									{ value: 'generate', label: 'Generate' },
								]}
								value={imageMode}
								onChange={(next) => onChange({ imageMode: next })}
							/>
						</Controller.Row>
						<Controller.TabPanel tabKey={imageMode}>
							{imageMode === 'preset' ? (
								<div
									data-slot="background-browse-card"
									className="flex shrink-0 items-center justify-between gap-3 rounded-md bg-foreground p-4 text-background"
								>
									<div className="flex min-w-0 flex-col">
										<Typography
											as="p"
											size="sm"
											weight="medium"
											className="truncate"
										>
											이미지를 선택하세요
										</Typography>
										<Typography
											as="p"
											size="xs"
											className="truncate text-background/60"
										>
											Brand Image
										</Typography>
									</div>
									<Button
										type="button"
										variant="muted"
										size="sm"
										disabled
										className="shrink-0 rounded-lg bg-background/25 text-background text-xs hover:bg-background/35"
									>
										Browse
									</Button>
								</div>
							) : (
								<>
									<Controller.ColorRow
										label="Line Color"
										value={LOCKED_LINE_COLOR}
										disabled
									/>
									<Controller.ColorRow
										label="Background Color"
										value={LOCKED_COLORIZE_BACKGROUND}
										disabled
									/>
									<Controller.Field
										label="Prompt"
										counter={`${prompt.length}/${PROMPT_MAX_LENGTH}`}
									>
										<Controller.Textarea
											value={prompt}
											onChange={(event) => setPrompt(event.target.value)}
											placeholder="이미지를 설명하세요"
											maxLength={PROMPT_MAX_LENGTH}
											rows={2}
										/>
										{aspectRatio && (
											<Typography size="xs" tone="muted">
												캔버스 비율 {aspectRatio}로 생성
											</Typography>
										)}
									</Controller.Field>
									<Button
										type="button"
										variant="muted"
										className="mt-0.5 h-11 w-full text-sm font-semibold"
										onClick={generate}
										disabled={generating || !profileId || !prompt.trim()}
									>
										{generating ? '생성 중…' : '이미지 생성'}
									</Button>
									{visibleError && <FieldError>{visibleError}</FieldError>}
								</>
							)}
						</Controller.TabPanel>
					</>
				)}

				{type === 'graphic' && (
					<>
						<Controller.Row label="Graphic Type">
							<Controller.Select
								options={[{ value: 'line', label: 'Line' }]}
								value="line"
								disabled
							/>
						</Controller.Row>
						<Controller.ColorRow
							label="Line Color"
							value={LOCKED_LINE_COLOR}
							disabled
						/>
						<Controller.ColorRow
							label="Background Color"
							value={LOCKED_COLORIZE_BACKGROUND}
							disabled
						/>
					</>
				)}
			</Controller.Group>

			{/* 디자인 SSOT: transform은 Background의 형제 섹션이고 구분선이 없다.
			    ponytail: 배경 transform의 기준 박스(=캔버스) 결정이 남아 잠근다. */}
			{type === 'image' && (
				<Controller.Group
					title="Image Transform"
					collapsible
					disabled
					className="border-t-0 pt-0"
				>
					<ImageTransformControl
						value={imageTransform}
						aspectRatio={canvasAspectRatio}
						onChange={setImageTransform}
					/>
				</Controller.Group>
			)}
			{type === 'graphic' && (
				<Controller.Group
					title="Graphic Transform"
					collapsible
					disabled
					className="border-t-0 pt-0"
				>
					<div className="flex flex-col gap-1 pb-2.5">
						<Controller.Pad
							aria-label="그래픽 위치"
							value={graphicOrigin}
							aspectRatio={canvasAspectRatio}
							onChange={setGraphicOrigin}
						/>
						<Controller.Row label="Dynamic Thickness">
							<Controller.Segmented
								aria-label="가변 두께"
								options={[
									{ value: 'off', label: 'Off' },
									{ value: 'on', label: 'On' },
								]}
								value={variableWeight}
								onChange={setVariableWeight}
							/>
						</Controller.Row>
						<Controller.Row label="Perspective">
							<Controller.Select
								options={[
									{ value: 'flat', label: 'Flat' },
									{ value: 'low-angle', label: 'Low Angle' },
								]}
								value={viewpoint}
								onChange={(next) => setViewpoint(next as typeof viewpoint)}
							/>
						</Controller.Row>
						<Controller.Row label="Angle">
							<Controller.Select
								options={[
									{ value: 'weak', label: 'Weak' },
									{ value: 'medium', label: 'Normal' },
									{ value: 'strong', label: 'Strong' },
								]}
								value={angleIntensity}
								onChange={(next) =>
									setAngleIntensity(next as typeof angleIntensity)
								}
							/>
						</Controller.Row>
					</div>
				</Controller.Group>
			)}
		</>
	)
}
