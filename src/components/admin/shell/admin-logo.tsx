export function AdminLogo() {
	return (
		<span
			aria-label="Living Brand System"
			role="img"
			style={{
				backgroundColor: 'var(--color-text)',
				display: 'block',
				height: 64,
				mask: 'url("/symbols/symbol_blk.svg") center / contain no-repeat',
				WebkitMask: 'url("/symbols/symbol_blk.svg") center / contain no-repeat',
				width: 64,
			}}
		/>
	)
}
