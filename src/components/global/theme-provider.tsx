'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type * as React from 'react'

// ponytail: 방치된 next-themes가 FOUC 방지용 인라인 <script>를 provider 안에서 렌더하는데,
// React 19가 이를 클라이언트 렌더에서 false-positive로 경고한다(SSR 스크립트는 정상 동작, prod 무영향).
// dev 전용으로 이 메시지만 좁게 필터한다. next-themes가 스크립트 비활성 옵션을 주거나 걷어내면 제거.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
	const originalError = console.error
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === 'string' &&
			args[0].includes('Encountered a script tag while rendering React component')
		) {
			return
		}
		originalError(...args)
	}
}

export function ThemeProvider(props: React.ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props} />
}
