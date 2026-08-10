'use client'

import { useEffect, useRef, useState } from 'react'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import {
	type ForwardStraightInput,
	forwardStraightInputSchema,
	forwardStraightToolContract,
} from '@/features/generate-graphic/forward-straight'
import {
	createForwardStraightScene,
	createForwardStraightSvg,
} from '@/features/generate-graphic/forward-straight-geometry'
import type { ForwardStraightPreview } from '@/features/generate-graphic/forward-straight-preview.client'
import { downloadBlob } from '@/lib/object-url'

export function ForwardStraightGenerator() {
	const [input, setInput] = useState<ForwardStraightInput>(
		forwardStraightToolContract.defaultInput,
	)
	const [previewReady, setPreviewReady] = useState(false)
	const inputRef = useRef(input)
	const previewContainerRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<ForwardStraightPreview>(null)

	useEffect(() => {
		let preview: ForwardStraightPreview | undefined
		let disposed = false

		async function mountPreview() {
			const container = previewContainerRef.current
			if (!container) return

			const { createForwardStraightPreview } = await import(
				'@/features/generate-graphic/forward-straight-preview.client'
			)
			if (disposed) return

			preview = createForwardStraightPreview({
				container,
				input: inputRef.current,
				onInputChange: setInput,
			})
			previewRef.current = preview
			setPreviewReady(true)
		}

		void mountPreview()

		return () => {
			disposed = true
			preview?.destroy()
			previewRef.current = null
		}
	}, [])

	useEffect(() => {
		const container = previewContainerRef.current
		if (!container) return

		const resizeObserver = new ResizeObserver(([entry]) => {
			if (entry) previewRef.current?.resize(entry.contentRect.width, entry.contentRect.height)
		})
		resizeObserver.observe(container)
		return () => resizeObserver.disconnect()
	}, [])

	useEffect(() => {
		inputRef.current = input
		previewRef.current?.update(input)
	}, [input])

	function updateControl(key: keyof ForwardStraightInput, value: boolean | string) {
		setInput((current) =>
			forwardStraightInputSchema.parse({
				...current,
				[key]: value,
			}),
		)
	}

	function updateOrigin(axis: 'x' | 'y', value: number) {
		setInput((current) => ({
			...current,
			origin: {
				...current.origin,
				[axis]: value,
			},
		}))
	}

	function downloadSvg() {
		const viewport = previewRef.current?.getViewport()
		if (!viewport) return

		const svg = createForwardStraightSvg(createForwardStraightScene(input, viewport))
		downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'forward-straight.svg')
	}

	return (
		<StudioWorkspace
			controller={
				<Card className="min-h-0 gap-0 py-0 lg:h-full">
					<CardHeader className="border-b border-border py-4">
						<CardTitle>그래픽 컨트롤러</CardTitle>
						<Typography size="xs" tone="muted">
							그래픽 설정을 조정하세요.
						</Typography>
					</CardHeader>

					<CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto py-4">
						<Typography as="h3" size="sm" weight="medium">
							설정
						</Typography>

						<FieldGroup>
							{forwardStraightToolContract.controls.map((control) => {
								const id = `forward-straight-${control.key}`

								if (control.type === 'boolean') {
									return (
										<Field key={control.key} orientation="horizontal">
											<FieldLabel htmlFor={id}>{control.label}</FieldLabel>
											<Checkbox
												id={id}
												checked={input[control.key] === true}
												onCheckedChange={(checked) =>
													updateControl(control.key, checked === true)
												}
											/>
										</Field>
									)
								}

								return (
									<Field key={control.key}>
										<FieldLabel htmlFor={id}>{control.label}</FieldLabel>
										<Select
											value={String(input[control.key])}
											onValueChange={(value) =>
												updateControl(control.key, value)
											}
										>
											<SelectTrigger id={id} className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{control.options.map((option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)
							})}
						</FieldGroup>
					</CardContent>

					<CardFooter className="border-t border-border py-4">
						<Button
							type="button"
							size="lg"
							className="w-full"
							onClick={downloadSvg}
							disabled={!previewReady}
						>
							SVG 다운로드
						</Button>
					</CardFooter>
				</Card>
			}
		>
			<figure className="flex min-h-0 flex-1 flex-col">
				<div
					ref={previewContainerRef}
					className="min-h-96 flex-1 overflow-hidden rounded-xl lg:min-h-0 [&>canvas]:block"
				/>
				<figcaption className="grid gap-2 pt-2">
					<Typography size="xs" tone="muted">
						캔버스의 레드 닷을 드래그하거나 슬라이더로 기준점을 조정할 수 있습니다.
					</Typography>
					<div className="grid gap-2 md:grid-cols-2">
						{(['x', 'y'] as const).map((axis) => (
							<label key={axis} className="flex items-center gap-2 text-xs">
								<span>기준점 {axis.toUpperCase()}</span>
								<input
									type="range"
									min={0}
									max={1}
									step={0.01}
									value={input.origin[axis]}
									aria-label={`기준점 ${axis.toUpperCase()}`}
									onChange={(event) =>
										updateOrigin(axis, Number(event.currentTarget.value))
									}
									className="min-w-0 flex-1 accent-foreground"
								/>
								<span className="w-9 text-right tabular-nums">
									{Math.round(input.origin[axis] * 100)}%
								</span>
							</label>
						))}
					</div>
				</figcaption>
			</figure>
		</StudioWorkspace>
	)
}
