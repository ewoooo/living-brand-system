import { GlobalFooter } from '@/components/global/footer/global-footer'

export default function HomePage() {
	return (
		<main className="flex h-full flex-col">
			<section aria-label="hero" className="flex flex-1 items-center justify-center px-6">
				<hgroup className="flex flex-col items-center gap-4 text-center">
					<h1 className="font-body text-6xl font-normal">Living Brand System</h1>
					<h2 className="font-body text-base font-normal">
						Living Brand System은 AI 에이전트와 결합된 통합 브랜드 생태 시스템입니다.
					</h2>
				</hgroup>
			</section>
			<GlobalFooter />
		</main>
	)
}
