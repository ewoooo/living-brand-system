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
 * 아이콘 그리드 — 사용 가능한 아이콘을 균일 그리드로 전시하고, 호버 시 설명 툴팁을 CSS-only로 노출한다.
 * 브랜드 무관: 아이콘 컴포넌트·이름·설명 전부 props.
 *
 * @example
 * <IconGrid icons={[{ id, Icon, name, description }]} />
 */
export type IconEntry = {
	id: string
	Icon: ComponentType<{ size?: number | string }>
	name: string
	description: string
}

export function IconGrid({ icons }: { icons: IconEntry[] }) {
	return (
		<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
			{icons.map(({ id, Icon, name, description }) => (
				<div
					key={id}
					className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-border bg-fill-muted transition-colors hover:bg-fill-hover"
				>
					<Icon size={28} />
					<span className="px-1 text-center font-body font-normal text-muted-foreground text-xs">
						{name}
					</span>
					{/* 호버 툴팁 (CSS-only) */}
					<span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-44 -translate-x-1/2 rounded-md bg-scrim px-3 py-2 text-center font-body font-normal text-scrim-foreground text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
						{description}
					</span>
				</div>
			))}
		</div>
	)
}

export function IconGridDemo() {
	return (
		<IconGrid
			icons={[
				{ id: 'idea', Icon: Idea, name: 'Idea', description: '아이디어·컨셉을 나타낼 때.' },
				{ id: 'chat', Icon: Chat, name: 'Chat', description: '대화·문의·커뮤니케이션.' },
				{ id: 'camera', Icon: Camera, name: 'Camera', description: '사진·촬영 관련 액션.' },
				{
					id: 'palette',
					Icon: ColorPalette,
					name: 'Palette',
					description: '컬러·테마 설정.',
				},
				{ id: 'type', Icon: TextFont, name: 'Typeface', description: '서체·타이포그래피.' },
				{ id: 'layers', Icon: Layers, name: 'Layers', description: '레이어·구조·계층.' },
				{
					id: 'security',
					Icon: Security,
					name: 'Security',
					description: '보안·권한·보호.',
				},
				{ id: 'view', Icon: View, name: 'View', description: '미리보기·표시/숨김.' },
				{
					id: 'download',
					Icon: Download,
					name: 'Download',
					description: '에셋·파일 내려받기.',
				},
				{ id: 'search', Icon: Search, name: 'Search', description: '검색·탐색.' },
				{ id: 'noti', Icon: Notification, name: 'Notification', description: '알림·공지.' },
				{ id: 'rocket', Icon: Rocket, name: 'Launch', description: '출시·시작·부스트.' },
			]}
		/>
	)
}
