'use client'

import { DialRoot } from 'dialkit'
import 'dialkit/styles.css'
import type { ReactNode } from 'react'

export default function AdminDialKitProvider({ children }: { children?: ReactNode }) {
	return (
		<>
			{children}
			<DialRoot position="bottom-right" />
		</>
	)
}
