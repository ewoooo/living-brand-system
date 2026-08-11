'use client'

import { Copy, Crop, SquareOutline } from '@carbon/icons-react'
import type * as React from 'react'
import { Controller } from '@/components/studio/shared/controller'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import { useImageStudio } from '@/features/image-studio/hooks/use-image-studio'
import { ImageCameraControl } from './image-camera-control'
import { ImageProfilePicker } from './image-profile-picker'

/**
 * 이미지 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 무엇을 그릴지는 편집 계약(config)만 보고 결정하고(색 섹션·카메라 섹션·읽기 전용 파생),
 * 세션 값은 컨텍스트의 prompt/generation/camera 그룹으로만 읽고 쓴다.
 * 디자인 SSOT: Figma HD_LBS_UI section 16:9137 "Image Usecase".
 */
export function ImageSidebar() {
	const { config, profiles, prompt, generation, camera, color, results, download } =
		useImageStudio()
	const { batch, ratio, resolution } = config.generateOptions
	const promptEmpty = !prompt.value.trim()

	return (
		// 자산 브라우저의 열림은 편집 세션이 아니라 이 화면의 표현 상태다 — 킷이 소유한다(Provider에 넣지 않는다).
		<Controller.Browser.Root>
			<Controller.Panel
				footer={
					<>
						<div className="flex flex-col gap-1">
							<div className="flex h-9 items-center pt-1">
								<span className="font-semibold text-muted-foreground text-sm">
									Setting
								</span>
							</div>
							{/* 디자인 SSOT(16:9079): 장수·비율·해상도가 한 줄에 3등분으로 앉는다. */}
							<div className="grid grid-cols-3 gap-1">
								<SettingRow
									icon={<Copy aria-hidden />}
									name="장수"
									options={batch.options.map(String)}
									value={String(generation.batch)}
									onChange={(value) => generation.setBatch(Number(value))}
								/>
								<SettingRow
									icon={<SquareOutline aria-hidden />}
									name="비율"
									options={ratio.options}
									value={generation.ratio}
									onChange={(value) =>
										generation.setRatio(value as ImageAspectRatio)
									}
								/>
								<SettingRow
									icon={<Crop aria-hidden />}
									name="해상도"
									options={resolution.options}
									value={generation.resolution}
									onChange={(value) =>
										generation.setResolution(value as ImageOutputSize)
									}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							{/* 색이 있으면 색을 구운 PNG, 없으면 원본이다 — 판정은 Provider가 한다. */}
							<Button
								className="h-11 flex-1"
								onClick={download.selected}
								disabled={results.selected === null}
							>
								선택한 이미지 저장
							</Button>
							<Button
								variant="muted"
								className="h-11 flex-1"
								onClick={download.all}
								disabled={!results.result?.images.length}
							>
								전부 저장
							</Button>
						</div>
					</>
				}
			>
				{/* 교체는 컨트롤러 왼쪽에 뜨는 자산 브라우저가 받는다 — 세션을 유지하는
				    교체 동작은 컨텍스트의 profiles.select가 소유한다. */}
				<Controller.AssetCard
					title={config.name}
					buttonLabel="Change"
					aria-label="프로파일 변경"
					tabs={['Image Profiles']}
					// 교체 후보가 자기 자신뿐이면 고를 것이 없다 — 카드만 남기고 그 사실을 적는다.
					empty={
						profiles.options.length <= 1
							? '교체할 다른 이미지 프로파일이 없습니다.'
							: undefined
					}
				>
					<ImageProfilePicker />
				</Controller.AssetCard>

				<Controller.Section title="Image">
					<Controller.Field
						label="Prompt"
						counter={`${prompt.value.length}/${config.prompt.maxLength}`}
					>
						<Controller.Textarea
							value={prompt.value}
							onChange={(event) => prompt.setValue(event.target.value)}
							placeholder="이미지를 설명하세요"
							maxLength={config.prompt.maxLength}
							rows={3}
						/>
					</Controller.Field>
					<Button
						variant="muted"
						className="mt-0.5 h-11 w-full font-semibold text-sm"
						onClick={generation.run}
						disabled={generation.busy || promptEmpty}
					>
						{generation.busy ? '생성 중…' : '이미지 생성'}
					</Button>
					{generation.error && (
						<Typography role="alert" size="sm" className="text-destructive">
							{generation.error}
						</Typography>
					)}
				</Controller.Section>

				{/* 시점 조정은 저장된 생성 이미지를 시드로 쓴다 — 결과를 고르기 전에는 닫힌 채 잠긴다. */}
				{config.supportsCameraControl && (
					<Controller.Section title="Camera Controls" disabled={!camera.seedImage}>
						{camera.seedImage && (
							<ImageCameraControl
								azimuthDeg={camera.azimuthDeg}
								elevationDeg={camera.elevationDeg}
								seedImage={camera.seedImage}
								busy={generation.busy}
								onChange={camera.setAngles}
								onRegenerate={camera.regenerate}
							/>
						)}
					</Controller.Section>
				)}

				{/* 계약에 색이 실려 있을 때만 세션 값이 존재한다 — 값 유무가 곧 개방 여부다
			    (개방 플래그를 따로 두지 않는다, docs/10 §3.6). */}
				{color.value && (
					<Controller.Section title="Profile Settings">
						<Controller.ColorRow
							label="Line Color"
							value={color.value.line}
							onChange={(line) => color.update({ line })}
						/>
						{color.value.background !== undefined && (
							<Controller.ColorRow
								label="Background Color"
								value={color.value.background}
								onChange={(background) => color.update({ background })}
							/>
						)}
					</Controller.Section>
				)}
			</Controller.Panel>
		</Controller.Browser.Root>
	)
}

type SettingRowProps = {
	/** 아이콘 라벨 — 접근 가능한 이름은 name이 sr-only로 동반한다(docs/10 §3.6). */
	icon: React.ReactNode
	name: string
	options: readonly string[]
	value: string
	onChange: (value: string) => void
}

/** Setting 푸터의 아이콘 라벨 행 — 선택지가 하나뿐이면 읽기 전용으로 그린다(잠금 플래그 없음). */
function SettingRow({ icon, name, options, value, onChange }: SettingRowProps) {
	const readonly = options.length <= 1

	return (
		<Controller.Row
			label={
				<>
					{icon}
					<span className="sr-only">{name}</span>
				</>
			}
			readonly={readonly}
			className="px-2.5"
		>
			{readonly ? (
				<span className="text-muted-foreground text-sm">{value}</span>
			) : (
				<Controller.Select
					options={options.map((option) => ({ label: option, value: option }))}
					value={value}
					onChange={onChange}
				/>
			)}
		</Controller.Row>
	)
}
