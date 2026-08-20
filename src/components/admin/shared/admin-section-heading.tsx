import type { ReactNode } from 'react'

/** 어드민 본문 섹션 헤딩 — 정본(76:4)의 초록 섹션 타이틀(레이어 설정·배경 설정·출력 설정). */
export function AdminSectionHeading({ children }: { children: ReactNode }) {
	return <h2 className="mb-4 font-semibold text-brand text-lg">{children}</h2>
}
