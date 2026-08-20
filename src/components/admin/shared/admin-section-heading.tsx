import type { ReactNode } from 'react'

/** 어드민 본문 섹션 헤딩 — 정본(83:1551) 26px Medium #003f08(brand-deep, 다크에서 자동 반전). */
export function AdminSectionHeading({ children }: { children: ReactNode }) {
	return <h2 className="mb-4 font-medium text-2xl text-brand-deep">{children}</h2>
}
