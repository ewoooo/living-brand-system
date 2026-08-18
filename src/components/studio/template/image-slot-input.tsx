'use client'

import { ChevronDown } from '@carbon/icons-react'
import { Controller } from '@/components/shared/controller'
import { ControllerControlRenderer } from '@/components/shared/controller-renderer'
import { ImageProfileFeatureRenderer } from '@/components/studio/image/image-profile-feature-renderer'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { acceptsImagePromptExecution } from '@/features/image-generation/domain/image-studio-config'
import type { ResolvedTemplateImageConfig } from '@/features/template-customization/domain/template-studio-config'
import type { TemplateImageSlotState } from '@/features/template-customization/hooks/use-template-studio'
import type { ControllerControlValue } from '@/modules/studio-controller/controller-definition'

type ImageSlotInputProps = {
	pinned: boolean
	readonly?: boolean
	contracts: readonly ResolvedTemplateImageConfig[]
	value: TemplateImageSlotState
	onFeatureChange: (controlId: string, value: ControllerControlValue) => void
	onProfileChange: (profileId: number) => void
	onPromptChange: (prompt: string) => void
	onGenerate: () => void
}

/**
 * Template 이미지 슬롯의 표현 컴포넌트. Profile 계약과 슬롯 상태는 Provider가 주며,
 * 이 컴포넌트는 HTTP나 생성 상태를 직접 소유하지 않는다.
 */
export function ImageSlotInput({
	pinned,
	readonly = false,
	contracts,
	value,
	onFeatureChange,
	onProfileChange,
	onPromptChange,
	onGenerate,
}: ImageSlotInputProps) {
	const selected = contracts.find((contract) => contract.config.id === value.profileId)
	const invalidPrompt = selected
		? !acceptsImagePromptExecution(selected.prompt, value.prompt)
		: true

	return (
		<div data-slot="image-slot-input" className="flex flex-col gap-1">
			{pinned || readonly ? (
				<Controller.Row label="Type" readonly>
					<span className="flex min-w-0 items-center gap-2">
						<span className="truncate text-sm text-muted-foreground">
							{selected?.config.name ?? '—'}
						</span>
						<ChevronDown
							aria-hidden
							className="size-4 shrink-0 text-muted-foreground"
						/>
					</span>
				</Controller.Row>
			) : (
				<Controller.Row label="Type">
					<Controller.Select
						options={contracts.map(({ config }) => ({
							value: String(config.id),
							label: config.name,
						}))}
						value={value.profileId === undefined ? undefined : String(value.profileId)}
						onChange={(next) => onProfileChange(Number(next))}
						placeholder="사용 가능한 프로파일 없음"
						disabled={readonly || value.generating || contracts.length === 0}
					/>
				</Controller.Row>
			)}
			{selected && (
				<ImageProfileFeatureRenderer
					config={selected.config}
					values={value.featureValues}
					bindings={
						readonly
							? Object.fromEntries(
									selected.config.controller.groups.flatMap((group) =>
										group.controls.map(({ id }) => [
											id,
											{ availability: 'readonly' },
										]),
									),
								)
							: undefined
					}
					onChange={onFeatureChange}
				/>
			)}
			{selected && (
				<>
					<ControllerControlRenderer
						definition={selected.ratio}
						value={selected.ratio.defaultValue}
						onChange={() => {}}
					/>
					<ControllerControlRenderer
						definition={
							readonly
								? { ...selected.prompt, availability: 'readonly' }
								: selected.prompt
						}
						value={value.prompt}
						onChange={(next) => {
							if (typeof next === 'string') onPromptChange(next)
						}}
					/>
				</>
			)}
			<Button
				type="button"
				variant="muted"
				className="mt-0.5 h-11 w-full text-sm font-semibold"
				onClick={onGenerate}
				disabled={readonly || value.generating || !selected || invalidPrompt}
			>
				{value.generating ? '생성 중…' : '이미지 생성'}
			</Button>
			{value.error && <FieldError>{value.error}</FieldError>}
		</div>
	)
}
