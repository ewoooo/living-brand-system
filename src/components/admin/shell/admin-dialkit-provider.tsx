'use client'

import { DialRoot } from 'dialkit'
import 'dialkit/styles.css'
import type { ReactNode } from 'react'

export function AdminDialKitProvider({ children }: { children?: ReactNode }) {
	return (
		<>
			{children}
			{/* 튜닝 패널이 기본 펼침이면 편집 폼 필드를 가린다 — 접힌 상태로 시작 */}
			<DialRoot position="bottom-right" defaultOpen={false} />
		</>
	)
}
