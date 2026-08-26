import {
	Apps,
	Badge,
	Book,
	Box,
	Branch,
	Bullhorn,
	Camera,
	ChartColumn,
	ColorPalette,
	Document,
	Draw,
	Earth,
	Grid,
	Idea,
	Image,
	Information,
	ListChecked,
	OverflowMenuHorizontal,
	Quotes,
	Share,
	Star,
	TextFont,
} from '@carbon/icons-react'
import type { ReactNode } from 'react'

// 토픽 slug → 어울리는 아이콘. 매칭될 때만 렌더된다(미매칭 토픽은 빈 슬롯).
const SECTION_ICONS: Record<string, ReactNode> = {
	instroduction: <Information size={24} />,
	instruction: <ListChecked size={24} />,
	'brand-core': <Idea size={24} />,
	'the-signature': <Quotes size={24} />,
	'the-narrative': <Book size={24} />,
	'brand-logo': <Star size={24} />,
	'color-system': <ColorPalette size={24} />,
	typography: <TextFont size={24} />,
	illustration: <Draw size={24} />,
	photography: <Camera size={24} />,
	'visual-system': <Grid size={24} />,
	sns: <Share size={24} />,
	advertisement: <Bullhorn size={24} />,
	stationery: <Document size={24} />,
	package: <Box size={24} />,
	etc: <OverflowMenuHorizontal size={24} />,

	// Brand Elements. CI 3종은 한 계열로 읽히게 골랐다 — 표식 자체 / 갈라져 나온 것 / 밖으로 나간 것.
	ci: <Badge size={24} />,
	'subsidiary-ci': <Branch size={24} />,
	'overseas-ci': <Earth size={24} />,
	layout: <Grid size={24} />,
	color: <ColorPalette size={24} />,
	'key-visual': <Image size={24} />,
	iconography: <Apps size={24} />,
	infographic: <ChartColumn size={24} />,
}

/**
 * 챕터 카드와 토픽 이동 버튼이 같은 아이콘을 쓰게 하는 단일 출처.
 * 🔴 navigation 서비스의 topic에는 slug가 없고 href만 있다 — 토픽 href의 마지막 조각이 slug이므로
 * 여기서 한 번만 잘라내고, 호출부는 slug든 href든 그대로 넘긴다.
 */
export function getTopicIcon(slugOrHref: string): ReactNode {
	const slug = slugOrHref.split('/').filter(Boolean).pop() ?? ''
	return SECTION_ICONS[slug]
}
