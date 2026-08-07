'use client'

import { motion } from 'motion/react'
import { useState } from 'react'

export function HeroMainSection() {
	return (
		<section
			aria-labelledby="hero-title"
			data-slot="hero-main-section"
			className="flex h-full flex-col items-center justify-center"
		>
			<div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.1em] text-[clamp(3rem,8vw,7rem)]">
				<h1
					id="hero-title"
					className="min-w-0 text-[1em] font-normal leading-none tracking-tight text-foreground"
				>
					Living Brand System
				</h1>
				<div className="flex items-start gap-[0.15em]">
					{/* Decorative dot */}
					<span
						aria-hidden="true"
						className="block size-[0.08em] animate-caret-blink bg-foreground"
					/>
					{/* Version metadata */}
					<VersionCell version="0.1" />
				</div>
			</div>
		</section>
	)
}

function VersionCell({ version }: { version: string }) {
	const VERSION_TAG = 'Alpha Unstable'
	const VERSION_NUMBER = version

	const [hovered, setHovered] = useState(false)

	return (
		<motion.p
			className="
			    inline-grid h-[0.8em] w-auto min-w-[0.8em] shrink-0
			    border border-primary p-[0.1em] text-primary
			    transition-colors duration-150
			    hover:bg-primary hover:text-primary-foreground
			    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
			    md:size-[0.8em]
			  "
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
		>
			<motion.span
				aria-hidden={hovered}
				className="col-start-1 row-start-1 w-min place-self-start text-[clamp(0.22rem,0.7rem,0.75rem)] leading-none"
				initial={false}
				animate={{ opacity: hovered ? 0 : 1, y: hovered ? -5 : 0 }}
				transition={{ duration: 0.2 }}
			>
				{VERSION_TAG}
			</motion.span>
			<motion.span
				aria-hidden={!hovered}
				className="col-start-1 row-start-1 place-self-center text-[clamp(0.22rem,2rem,6rem)] leading-none"
				initial={false}
				animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 5 }}
				transition={{ duration: 0.2 }}
			>
				{VERSION_NUMBER}
			</motion.span>
		</motion.p>
	)
}
