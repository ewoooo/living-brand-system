'use client'

import { useEffect } from 'react'
import { ControllerBrowser } from '@/components/studio/shared/controller'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { useGraphicStudio } from '@/features/graphic-generation/hooks/use-graphic-studio'
import { cn } from '@/lib/utils'

/** Controller.Browser 본문에서 현재 Graphic 계약을 같은 편집 세션 안에서 교체한다. */
export function GraphicProfilePicker() {
	const { config, profiles } = useGraphicStudio()
	const { load } = profiles.browse
	// 이 컴포넌트는 패널이 열릴 때 마운트된다(radix가 닫힌 콘텐츠를 언마운트한다) — mount가 곧 "열림"이다.
	useEffect(() => {
		load()
	}, [load])

	return (
		<div data-slot="graphic-profile-picker" className="grid shrink-0 grid-cols-3 gap-3 pr-1">
			{(profiles.browse.data ?? []).map((option) => {
				const current = option.id === config.id

				return (
					<ControllerBrowser.Close key={option.id} asChild>
						<button
							type="button"
							aria-current={current || undefined}
							onClick={() => profiles.select(option.id)}
							className={cn(
								'flex h-64 flex-col overflow-hidden rounded-lg border bg-background/5 text-left outline-none focus-visible:ring-2 focus-visible:ring-background/50',
								current
									? 'border-2 border-background/60'
									: 'border-background/10 hover:bg-background/10',
							)}
						>
							<div className="min-h-0 flex-1 bg-background/20" />
							<div className="flex shrink-0 flex-col gap-2 bg-background/5 px-1.5 py-2">
								<Typography as="p" size="xs" weight="medium" className="truncate">
									{option.name}
								</Typography>
								<div className="flex h-5 items-center gap-0.5">
									<Badge variant="muted" shape="rounded">
										{option.type.toUpperCase()}
									</Badge>
								</div>
							</div>
						</button>
					</ControllerBrowser.Close>
				)
			})}
		</div>
	)
}
