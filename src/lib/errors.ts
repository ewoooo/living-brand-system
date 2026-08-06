export class AgentConfigurationError extends Error {
	constructor(message = 'Agent is not configured.') {
		super(message)
		this.name = 'AgentConfigurationError'
	}
}

/** 에셋 영속화가 컬렉션 접근 제어에 막혔을 때 — 라우트가 403으로 변환한다. */
export class AssetAccessDeniedError extends Error {
	constructor(message = 'Not allowed to save template assets.') {
		super(message)
		this.name = 'AssetAccessDeniedError'
	}
}

export class FigmaConfigurationError extends Error {
	constructor(message = 'Figma integration is not configured.') {
		super(message)
		this.name = 'FigmaConfigurationError'
	}
}

export type FigmaApiStage = 'image-fills' | 'images' | 'nodes'

/** Figma REST 실패의 사용자 조치 정보만 보존한다. 응답 본문과 token은 담지 않는다. */
export class FigmaApiError extends Error {
	constructor(
		readonly stage: FigmaApiStage,
		readonly status: number,
		readonly retryAfter?: number,
		readonly planTier?: string,
		readonly rateLimitType?: string,
	) {
		super(`Figma ${stage} API failed (${status})`)
		this.name = 'FigmaApiError'
	}
}

/** import 내부의 예상 가능한 실패를 안전한 사용자 문구와 HTTP 상태로 전달한다. */
export class FigmaImportError extends Error {
	constructor(
		message: string,
		readonly userMessage: string,
		readonly status = 502,
		options?: ErrorOptions,
	) {
		super(message, options)
		this.name = 'FigmaImportError'
	}
}
