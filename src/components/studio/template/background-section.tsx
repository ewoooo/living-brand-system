'use client'

import { useState } from 'react'
import { Controller } from '@/components/studio/shared/controller'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	type ImageTransformValue,
	TransformPad,
} from './image-transform-control'

type BackgroundType = 'color' | 'image' | 'graphic'
type BackgroundImageMode = 'preset' | 'generate'

const PROMPT_MAX_LENGTH = 500

const BACKGROUND_TYPE_LABELS: Record<BackgroundType, string> = {
	color: 'Color',
	image: 'Image',
	graphic: 'Graphic',
}

type BackgroundSectionProps = {
	/** 편집 계약(config)이 이 템플릿에 허용한 배경 종류 — Type 목록이 여기서 나온다. */
	allowedTypes: readonly BackgroundType[]
	/** 템플릿 캔버스 종횡비(w/h) — 배경 transform 패드가 같은 비율로 그려진다. */
	canvasAspectRatio?: number
}

/**
 * 디자인 SSOT(2:2071 Sidebar State)의 Background 상태 분기 — Type이 하위 컨트롤 세트를 갈아끼운다.
 * Color: 배경색 / Image: Preset(브랜드 이미지 선택)·Generate(프롬프트 생성) + Image Transform /
 * Graphic: 그래픽 종류·색 + Graphic Transform(포지션·가변 두께·시점·각도 — forward-straight 계약과 1:1).
 * ponytail: UI-first — 전부 로컬 state이고 compose·생성·브라우즈 배선은 3단계에서 한다.
 */
export function BackgroundSection({ allowedTypes, canvasAspectRatio }: BackgroundSectionProps) {
	const [type, setType] = useState<BackgroundType>(allowedTypes[0] ?? 'color')
	const [imageMode, setImageMode] = useState<BackgroundImageMode>('preset')
	const [lineColor, setLineColor] = useState('#000000')
	const [backgroundColor, setBackgroundColor] = useState('#ffffff')
	const [prompt, setPrompt] = useState('')
	const [imageTransform, setImageTransform] =
		useState<ImageTransformValue>(IMAGE_TRANSFORM_DEFAULT)
	// Graphic Transform — 현재 그래픽 기능(forward-straight)이 지원하는 파라미터만 노출한다.
	const [graphicOrigin, setGraphicOrigin] = useState({ x: 0, y: 0 })
	const [variableWeight, setVariableWeight] = useState<'off' | 'on'>('off')
	const [viewpoint, setViewpoint] = useState<'flat' | 'low-angle'>('flat')
	const [angleIntensity, setAngleIntensity] = useState<'weak' | 'medium' | 'strong'>('medium')

	return (
		<>
			<Controller.Section title="Background">
				<Controller.Row label="Type">
					<Controller.Select
						options={allowedTypes.map((allowed) => ({
							value: allowed,
							label: BACKGROUND_TYPE_LABELS[allowed],
						}))}
						value={type}
						onChange={(value) => setType(value as BackgroundType)}
					/>
				</Controller.Row>

				{type === 'color' && (
					<Controller.ColorRow
						label="Background Color"
						value={backgroundColor}
						onChange={setBackgroundColor}
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
								onChange={setImageMode}
							/>
						</Controller.Row>
						<Controller.TabPanel tabKey={imageMode}>
							{imageMode === 'preset' ? (
								// ponytail: 브랜드 이미지 피커는 3단계 배선 — 지금은 선택 카드 UI만 세운다.
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
										className="shrink-0 rounded-lg bg-background/25 text-background text-xs hover:bg-background/35"
									>
										Browse
									</Button>
								</div>
							) : (
								<>
									<Controller.ColorRow
										label="Line Color"
										value={lineColor}
										onChange={setLineColor}
									/>
									<Controller.ColorRow
										label="Background Color"
										value={backgroundColor}
										onChange={setBackgroundColor}
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
									</Controller.Field>
									{/* ponytail: 배경 생성 요청은 3단계 배선 — 프롬프트 없으면 비활성만 유지한다. */}
									<Button
										type="button"
										variant="muted"
										className="mt-0.5 h-11 w-full text-sm font-semibold"
										disabled={!prompt.trim()}
									>
										이미지 생성
									</Button>
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
							/>
						</Controller.Row>
						<Controller.ColorRow
							label="Line Color"
							value={lineColor}
							onChange={setLineColor}
						/>
						<Controller.ColorRow
							label="Background Color"
							value={backgroundColor}
							onChange={setBackgroundColor}
						/>
					</>
				)}
			</Controller.Section>

			{/* 디자인 SSOT: transform은 Background의 형제 섹션이고 구분선이 없다.
			    ponytail: 배경 이미지 배정이 아직 없어(3단계 배선) 생성 전 규칙대로 닫힌 채 잠근다. */}
			{type === 'image' && (
				<Controller.Section title="Image Transform" disabled className="border-t-0 pt-0">
					<ImageTransformControl
						value={imageTransform}
						aspectRatio={canvasAspectRatio}
						onChange={setImageTransform}
					/>
				</Controller.Section>
			)}
			{type === 'graphic' && (
				<Controller.Section title="Graphic Transform" className="border-t-0 pt-0">
					<div className="flex flex-col gap-1 pb-2.5">
						<TransformPad
							ariaLabel="그래픽 위치"
							x={graphicOrigin.x}
							y={graphicOrigin.y}
							aspectRatio={canvasAspectRatio}
							onChange={(x, y) => setGraphicOrigin({ x, y })}
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
								onChange={(value) => setViewpoint(value as typeof viewpoint)}
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
								onChange={(value) =>
									setAngleIntensity(value as typeof angleIntensity)
								}
							/>
						</Controller.Row>
					</div>
				</Controller.Section>
			)}
		</>
	)
}
