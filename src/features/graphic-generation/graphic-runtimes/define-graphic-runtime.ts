import {
	type GraphicRuntimeManifest,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'

/** Graphic 자산이 서버 안전 Runtime Manifest를 한 번 정의하는 authoring 경계. */
export function defineGraphicRuntime<const Manifest extends GraphicRuntimeManifest>(
	manifest: Manifest,
): Manifest {
	parseGraphicStudioConfig(manifest)
	return manifest
}
