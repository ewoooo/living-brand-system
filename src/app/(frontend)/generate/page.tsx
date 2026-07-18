import { ContentFrame } from '@/components/global/content-frame'
import { PageHeader } from '@/components/global/page-header'
import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { TextGenerator } from '@/features/text-generation/components/text-generator'

// 생성 표면: 이미지 생성 + 텍스트 생성을 수직으로 단순 배치한다. 두 feature는 각자 소유·독립.
export default function GeneratePage() {
	return (
		<ContentFrame className="flex flex-col gap-12 py-10">
			<PageHeader eyebrow="생성하기" title="생성" />
			<div id="image" className="scroll-mt-8">
				<ImageGenerator />
			</div>
			<hr className="border-border" />
			<div id="text" className="scroll-mt-8">
				<TextGenerator />
			</div>
		</ContentFrame>
	)
}
