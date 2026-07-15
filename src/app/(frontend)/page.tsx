import { GlobalFooter } from '@/components/global/footer/global-footer'

export default function HomePage() {
	return (
		<main className="grid h-full overflow-y-auto">
			<section aria-label="hero" className="grid h-screen place-items-center">
				<hgroup className="flex flex-col items-center gap-4">
					<h1 className="type-large-title font-sans">Living Brand System</h1>
					<h2 className="font-sans">
						Living Brand System은 AI 에이전트와 결합된 통합 브랜드 생태 시스템입니다.
					</h2>
				</hgroup>
			</section>
			<section aria-label="function-description" className="max-w-[1600px] w-full mx-auto"></section>
			<section aria-label="updates" className=""></section>
			<section aria-label="changelogs" className=""></section>
			<GlobalFooter />
		</main>
	)
}
