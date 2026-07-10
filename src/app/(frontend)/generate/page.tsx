import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { TextGenerator } from '@/features/text-generation/components/text-generator'

// 생성 표면: 이미지 생성 + 텍스트 생성을 수직으로 단순 배치한다. 두 feature는 각자 소유·독립.
export default function GeneratePage() {
	return (
		<div className="flex w-full max-w-[1250px] flex-col gap-12 px-8 py-10">
			<header>
				<h2 className="pb-1 text-muted-foreground text-xl">생성하기</h2>
				<h1 className="text-3xl">생성</h1>
			</header>
			<div id="image" className="scroll-mt-8">
				<ImageGenerator />
			</div>
			<hr className="border-border" />
			<div id="text" className="scroll-mt-8">
				<TextGenerator />
			</div>
		</div>
	)
}
