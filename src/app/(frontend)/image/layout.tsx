import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { SideNav } from '@/components/global/side-nav'

// ponytail: 형식용 정적 side-nav. 실제 카테고리/히스토리 생기면 서비스로 교체.
const NAV_GROUPS = [
	{
		key: 'image',
		title: '이미지 생성',
		items: [{ key: 'new', label: '새 이미지', href: '/image' }],
	},
]

export default function ImageLayout({ children }: { children: React.ReactNode }) {
	return <SectionLayout nav={<SideNav groups={NAV_GROUPS} />}>{children}</SectionLayout>
}
