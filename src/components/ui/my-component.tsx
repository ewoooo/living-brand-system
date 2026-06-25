export interface MyComponentProps {
	label: string
}

export function MyComponent({ label }: MyComponentProps) {
	return <button type="button">{label}</button>
}
