import { GlobalFooter } from '@/components/global/footer/global-footer'

export default function HomePage() {
	return (
		<main className="grid h-full overflow-y-auto">
			<section aria-label="hero" className="grid min-h-full place-items-center">
				<hgroup className="flex flex-col items-center gap-4">
					<h1 className="type-large-title">Living Brand System</h1>
					<h2>
						Living Brand System은 AI 에이전트와 결합된 통합 브랜드 생태 시스템입니다.
					</h2>
				</hgroup>
			</section>
			<section aria-label="function"></section>
			<GlobalFooter />
		</main>
	)
}
