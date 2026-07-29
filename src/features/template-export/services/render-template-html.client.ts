'use client'

// PDF export 세션이 새 renderer 경로로 전환될 때까지 유지하는 호환 경계다.
export {
	waitForExportStageAssets,
	withSafeExportStage,
} from './render-template-export-stage.client'
