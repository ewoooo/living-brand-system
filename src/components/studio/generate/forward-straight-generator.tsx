'use client'

import { useEffect, useRef, useState } from 'react'
import { StudioWorkspace } from '@/components/studio/studio-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import { revokeBlob } from '@/lib/object-url'

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
		const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
		try {
			const link = document.createElement('a')
			link.href = url
			link.download = 'forward-straight.svg'
			link.click()
		} finally {
			revokeBlob(url)
		}
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

						{forwardStraightToolContract.controls.map((control) => {
							const id = `forward-straight-${control.key}`

							if (control.type === 'boolean') {
								return (
									<div
										key={control.key}
										className="flex items-center justify-between gap-3"
									>
										<Label htmlFor={id}>{control.label}</Label>
										<Checkbox
											id={id}
											checked={input[control.key] === true}
											onCheckedChange={(checked) =>
												updateControl(control.key, checked === true)
											}
										/>
									</div>
								)
							}

							return (
								<div key={control.key} className="flex flex-col gap-2">
									<Label htmlFor={id}>{control.label}</Label>
									<select
										id={id}
										value={String(input[control.key])}
										onChange={(event) =>
											updateControl(control.key, event.currentTarget.value)
										}
										className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
									>
										{control.options.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							)
						})}
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
