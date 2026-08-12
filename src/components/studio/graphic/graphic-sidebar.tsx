'use client'

import { Controller } from '@/components/studio/shared/controller'
import { ControllerRenderer } from '@/components/studio/shared/controller-renderer'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useGraphicStudio } from '@/features/graphic-studio/hooks/use-graphic-studio'

/** Definition을 Controller primitive로 투영한다. 캔버스와 런타임 구현은 모른다. */
export function GraphicSidebar() {
	const { config, controls, output } = useGraphicStudio()

	return (
		<Controller.Root data-slot="graphic-sidebar">
			<Controller.Header>
				<Typography as="p" size="base" weight="medium">
					{config.name}
				</Typography>
				<Typography size="xs" tone="muted">
					{config.type.toUpperCase()} Graphic
				</Typography>
			</Controller.Header>
			<Controller.Content>
				<ControllerRenderer
					groups={config.controller.groups}
					values={controls.values}
					bindings={controls.bindings}
					onChange={controls.update}
				/>
			</Controller.Content>
			{config.output.formats.includes('svg') && (
				<Controller.Footer>
					<Button
						type="button"
						size="lg"
						className="w-full"
						onClick={output.download}
						disabled={output.busy || !output.ready}
					>
						SVG 다운로드
					</Button>
					{output.error && (
						<Typography role="alert" size="sm" className="text-destructive">
							{output.error}
						</Typography>
					)}
				</Controller.Footer>
			)}
		</Controller.Root>
	)
}
