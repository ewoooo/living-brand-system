const placeholder =
	'아이디어를 코드로 구현하세요. 더 높은 수준의 방향성에 집중할 수 있도록 구현은 위임하세요.'

interface GuidelineChapterHeaderProps {
	title: string
	label?: string
	description: string
}

export function GuidelineChapterHeader({
	title,
	label = placeholder,
	description,
}: GuidelineChapterHeaderProps) {
	return (
		<header className="mb-8">
			<hgroup className="mb-4">
				<h1 className="pb-1 text-md text-muted-foreground">{title}</h1>
				<h2 className="max-w-96 text-balance text-3xl">{label}</h2>
			</hgroup>
			<p className="mb-4 max-w-xl text-muted-foreground">{description}</p>
		</header>
	)
}
