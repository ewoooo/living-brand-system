'use client'

import { BlocksField, Button, useLivePreviewContext } from '@payloadcms/ui'
import type { BlocksFieldClientComponent } from 'payload'

const GuidelineBlocksField: BlocksFieldClientComponent = (props) => {
	const { previewURL } = useLivePreviewContext()

	const openBetterEditor = () => {
		// ponytail: Better Editor에 배치 API가 생기면 DOM 위임을 직접 컴포넌트 호출로 교체한다.
		document.querySelector<HTMLButtonElement>('.doc-controls .better-editor-toggle')?.click()
	}

	return (
		<section className="guideline-blocks-field">
			{previewURL && (
				<div className="guideline-blocks-field__action">
					<Button
						buttonStyle="secondary"
						margin={false}
						onClick={openBetterEditor}
						type="button"
					>
						Better Editor 열기
					</Button>
				</div>
			)}
			<BlocksField {...props} />
		</section>
	)
}

export default GuidelineBlocksField
