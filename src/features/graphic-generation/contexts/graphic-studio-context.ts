'use client'

import { createContext } from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { LazyResource } from '@/hooks/use-lazy-resource'
import type {
	ControllerControlValue,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicStudioValue = {
	profiles: {
		/** 교체 후보 — 자산 브라우저가 열릴 때 가져온다. 열기 전에는 data가 null이다. */
		browse: LazyResource<readonly GraphicStudioConfig[]>
		select: (profileId: string) => void
	}
	config: GraphicStudioConfig
	controls: {
		values: ControllerValues
		bindings: ControllerRuntimeBindings
		update: (controlId: string, value: ControllerControlValue) => boolean
		registerBindings: (bindings: ControllerRuntimeBindings) => void
	}
	/** 매니저가 제공한 시작점. 고르면 값이 들어가고, 컨트롤을 만지면 `applied`가 풀린다. */
	preset: {
		applied: string | null
		apply: (presetId: string) => void
	}
}

export const GraphicStudioContext = createContext<GraphicStudioValue | null>(null)
