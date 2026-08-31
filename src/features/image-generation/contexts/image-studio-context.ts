'use client'

import { createContext } from 'react'
import type { ImageStudioConfig } from '@/features/image-generation/domain/image-studio-config'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/image-generation/image-size'
import type { ImageColorAdjustment } from '@/features/image-generation/runtime/image-colorize'
import type { LazyResource } from '@/hooks/use-lazy-resource'
import type {
	ControllerControlValue,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

/** 그리드 카드 한 장. 참조와 결과가 같은 형태라 그리드가 둘을 구분해 다루지 않아도 된다. */
export type ImageResultImage = {
	src: string
	generatedImageId: number | null
	profileId: number | null
}

export type ImageStudioValue = {
	profiles: {
		/** 이 세션에서 쓴 계약들 — 계약은 언제나 이 중 하나다. 결과가 자기 프로파일의 출력 능력을 되찾는 데도 쓴다. */
		options: readonly ImageStudioConfig[]
		/** 교체 후보 — 자산 브라우저가 열릴 때 가져온다. 열기 전에는 data가 null이다. */
		browse: LazyResource<readonly ImageStudioConfig[]>
		select: (profileId: number) => void
	}
	/** 현재 프로파일의 편집 계약 — 컨트롤러는 이 객체만 보고 컨트롤을 그린다. */
	config: ImageStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => void
	}
	prompt: {
		value: string
		setValue: (text: string) => void
	}
	generation: {
		batch: number
		setBatch: (count: number) => void
		ratio: ImageAspectRatio
		setRatio: (ratio: ImageAspectRatio) => void
		resolution: ImageOutputSize
		setResolution: (resolution: ImageOutputSize) => void
		run: () => void
		canRun: boolean
		busy: boolean
		error: string | null
	}
	color: {
		/** 색 조정 값 — 계약이 색을 열지 않으면 null이고, 그때는 색 행도 굽는 저장도 없다. */
		value: ImageColorAdjustment | null
		update: (patch: Partial<ImageColorAdjustment>) => void
	}
	reference: {
		/** 첨부한 참조 이미지의 data URI — 저장하지 않으므로 이 세션 메모리가 유일한 사본이다. */
		value: string | null
		name: string | null
		/** 형식·용량으로 거절한 사유. 서버까지 가지 않고 화면에서 잡은 것만 여기 있다. */
		error: string | null
		attach: (file: File) => void
		clear: () => void
	}
	camera: {
		azimuthDeg: number
		elevationDeg: number
		setAngles: (angles: { azimuthDeg: number; elevationDeg: number }) => void
		/** 시점을 다시 잡을 참조 — null이면 대상이 없다(컨트롤러가 그룹을 잠근다). */
		seedImage: string | null
		regenerate: () => void
	}
	results: {
		/** 그리드가 그리는 순서 그대로 — 참조가 있으면 0번이 참조다. */
		items: readonly ImageResultImage[]
		/** items에서 참조가 차지하는 자리. 참조가 없으면 null. */
		referenceIndex: number | null
		/** 결과와 현재 프로파일이 같을 때만 적용할 색. 다른 프로파일의 기능은 소급하지 않는다. */
		color: ImageColorAdjustment | null
		/** 요청한 장수 — 생성 중 자리표시자 개수. */
		requested: number
		selected: number | null
		select: (index: number | null) => void
		/** 저장 크기 계산에 쓰는 직전 요청의 출력 조건. */
		output: { aspectRatio: ImageAspectRatio; imageSize: ImageOutputSize } | null
	}
}

export const ImageStudioContext = createContext<ImageStudioValue | null>(null)
