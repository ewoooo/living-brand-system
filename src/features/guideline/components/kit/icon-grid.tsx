import {
	Camera,
	Chat,
	ColorPalette,
	Download,
	Idea,
	Layers,
	Notification,
	Rocket,
	Search,
	Security,
	TextFont,
	View,
} from '@carbon/icons-react'
import type { ComponentType } from 'react'

/**
 * 아이콘 그리드 — 아이콘들을 하나의 큰 박스 안에 레이블 없이 배치하고, 호버 시 아이콘 바로 위에
 * 이름 툴팁을 CSS-only로 노출한다. 개별 카드/보더 없이 아이콘만 보이는 형태.
 * 브랜드 무관: 아이콘 컴포넌트·이름 전부 props.
 *
 * @example
 * <IconGrid icons={[{ id, Icon, name }]} />
 */
export type IconEntry = {
	id: string
	Icon: ComponentType<{ size?: number | string }>
	name: string
}

export function IconGrid({ icons }: { icons: IconEntry[] }) {
	return (
		<div className="rounded-lg border border-border p-6 md:p-10">
			<div className="grid grid-cols-4 gap-x-4 gap-y-8 sm:grid-cols-6 md:grid-cols-8">
				{icons.map(({ id, Icon, name }) => (
					<div key={id} className="group relative flex items-center justify-center">
						<Icon size={28} />
						{/* 호버 툴팁 — 아이콘 바로 위 */}
						<span className="-translate-x-1/2 pointer-events-none absolute bottom-full left-1/2 mb-2 whitespace-nowrap rounded-md bg-scrim px-2.5 py-1 font-body font-normal text-scrim-foreground text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
							{name}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

export function IconGridDemo() {
	return (
		<IconGrid
			icons={[
				{ id: 'idea', Icon: Idea, name: 'Idea' },
				{ id: 'chat', Icon: Chat, name: 'Chat' },
				{ id: 'camera', Icon: Camera, name: 'Camera' },
				{ id: 'palette', Icon: ColorPalette, name: 'Palette' },
				{ id: 'type', Icon: TextFont, name: 'Typeface' },
				{ id: 'layers', Icon: Layers, name: 'Layers' },
				{ id: 'security', Icon: Security, name: 'Security' },
				{ id: 'view', Icon: View, name: 'View' },
				{ id: 'download', Icon: Download, name: 'Download' },
				{ id: 'search', Icon: Search, name: 'Search' },
				{ id: 'noti', Icon: Notification, name: 'Notification' },
				{ id: 'rocket', Icon: Rocket, name: 'Launch' },
			]}
		/>
	)
}
