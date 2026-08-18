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
}

export const GraphicStudioContext = createContext<GraphicStudioValue | null>(null)
