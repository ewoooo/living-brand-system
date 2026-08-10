import type React from 'react'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default function CreateLayout({ children }: { children: React.ReactNode }) {
	return children
}
