'use client'

import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'
import {
	StemMeasure,
	type StemMeasurement,
} from '@/features/guideline/blocks/stem-clear-space/view'
import { relationshipId } from '@/features/guideline/utils/block-text'
import { siblingPath } from './sibling-path'

// clearSpace 블록 admin 필드 — 선택한 로고 위에서 줄기를 클릭해 A(두께)·위치를 정밀 측정하고
// 형제 필드 stemRatio·stemX에 기록한다. 측정은 원본 SVG를 고해상도로 래스터화하므로 정확하다.
// S3 url은 cross-origin이라 canvas 픽셀 읽기가 막히므로 same-origin 파일 라우트를 쓴다.
const StemPickerField: UIFieldClientComponent = ({ path }) => {
	const logoPath = siblingPath(path, 'logo')
	const logoValue = useFormFields(([fields]) => fields[logoPath]?.value)
	const { value: ratio, setValue: setRatio } = useField<number>({
		path: siblingPath(path, 'stemRatio'),
	})
	const { value: x, setValue: setX } = useField<number>({ path: siblingPath(path, 'stemX') })

	const logoId = relationshipId(logoValue)
	const [src, setSrc] = useState<string | null>(null)

	useEffect(() => {
		if (logoId == null) {
			setSrc(null)
			return
		}
		const controller = new AbortController()
		void fetch(`/api/brand-logos/${logoId}?depth=0`, { signal: controller.signal })
			.then((response) => (response.ok ? response.json() : null))
			.then((doc: { filename?: string; url?: string } | null) => {
				// canvas 측정을 위해 same-origin 파일 라우트 우선(S3 url은 cross-origin).
				setSrc(doc?.filename ? `/api/brand-logos/file/${doc.filename}` : (doc?.url ?? null))
			})
			.catch(() => {
				/* abort/network — src 미설정 */
			})
		return () => controller.abort()
	}, [logoId])

	const measurement: StemMeasurement | null =
		typeof ratio === 'number' && typeof x === 'number' ? { ratio, x } : null

	return (
		<div className="field-type ui">
			<FieldLabel label="줄기 측정 (A 단위)" path={path} />
			{src ? (
				<StemMeasure
					logo={src}
					value={measurement}
					onChange={(stem) => {
						setRatio(stem.ratio)
						setX(stem.x)
					}}
				/>
			) : (
				<p className="font-body text-muted-foreground text-sm">
					먼저 위에서 로고를 선택하면 줄기를 측정할 수 있습니다.
				</p>
			)}
		</div>
	)
}

export default StemPickerField
