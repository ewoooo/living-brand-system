type Props = {
	cellData?: unknown
}

export default function ColorSwatchCell({ cellData }: Props) {
	const hex = typeof cellData === 'string' ? cellData : ''

	return (
		<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
			<span
				aria-hidden="true"
				style={{
					width: 18,
					height: 18,
					borderRadius: 4,
					border: '1px solid var(--theme-elevation-200)',
					backgroundColor: hex,
				}}
			/>
			<span>{hex}</span>
		</span>
	)
}
