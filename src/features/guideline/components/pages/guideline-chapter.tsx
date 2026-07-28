import {
	Book,
	Box,
	Bullhorn,
	Camera,
	ColorPalette,
	Document,
	Draw,
	Grid,
	Idea,
	Information,
	ListChecked,
	OverflowMenuHorizontal,
	Quotes,
	Share,
	Star,
	TextFont,
} from '@carbon/icons-react'
import type { ReactNode } from 'react'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import type { GetGuidelineChapterOutput } from '../../services/get-guideline-chapter.service'
import { GuidelineDescription } from '../globals/guideline-description'
import { GuidelineHeader } from '../globals/guideline-header'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineNavigationGrid } from '../guideline-navigation-grid'
import { RefreshRouteOnSave } from '../refresh-route-on-save'

const variant = 'chapter' satisfies GuidelineVariant

// 섹션 slug → 어울리는 아이콘. 매칭될 때만 카드 좌하단에 렌더된다(미매칭 섹션은 빈 슬롯).
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
}

export function GuidelineChapter({
	chapter,
	chapterSlug,
	isPreview,
}: {
	chapter: GetGuidelineChapterOutput
	chapterSlug: string
	isPreview: boolean
}) {
	return (
		<GuidelineContentFrame>
			{isPreview && <RefreshRouteOnSave />}
			<GuidelineHeader variant={variant} title={chapter.title} />
			<GuidelineDescription variant={variant} description={chapter.description} />
			<GuidelineNavigationGrid
				variant="md"
				items={chapter.sections.map((section) => ({
					id: section.id,
					title: section.title,
					description: section.description,
					href: `/guideline/${chapterSlug}/${section.slug}`,
					icon: SECTION_ICONS[section.slug],
				}))}
			/>
		</GuidelineContentFrame>
	)
}
