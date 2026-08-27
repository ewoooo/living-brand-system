'use client'

import { useCallback, useState } from 'react'
import type {
	TemplateRasterArtifactProducer,
	TemplateVectorArtifactResult,
	TemplateVideoArtifactProducer,
} from '@/features/template-customization/runtime/template-runtime.client'
import {
	acceptsControllerExecutionValues,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import type { ExportRequest, StudioOutputFormat, VideoExportSpec } from '../export-contract'
import type { PrintPpi } from '../print-policy'
import { createRasterExportRequest } from '../services/create-raster-export-request'
import { executeArtifactExport } from '../services/export-artifact.client'
import { resolveMaxExportScale, type StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

export type TemplateExportMetadata = {
	fileName: string
	width: number
	height: number
	/** 캔버스 좌표계 대비 허용 최대 출력 배율 — 1이면 배율 선택지가 없다. */
	maxScale: number
	controller: {
		groups: readonly ControllerGroupDefinition[]
		values: Readonly<ControllerValues>
	}
}

export type TemplateExportView = ReturnType<typeof useTemplateExport>

/** 사이드바가 안내할 출력 크기를 요청에서 되읽는다. 요청이 없으면 캔버스에 배율만 곱한다. */
function resolveOutputSize(
	request: TemplateExportRequest | null,
	metadata: TemplateExportMetadata | null,
	scale: number,
): { width: number; height: number } | null {
	if (!metadata) return null
	if (request?.format === 'mp4') {
		return { width: request.options.width, height: request.options.height }
	}
	return { width: metadata.width * scale, height: metadata.height * scale }
}
type TemplateExportRequest = Extract<ExportRequest, { artifact: 'raster' | 'video' | 'vector' }>

/** Template Raster Artifact를 공통 ExportRequest와 Artifact executor에 연결한다. */
export function useTemplateExport({
	artifact,
	vectorArtifact,
	videoArtifact,
	capability,
	metadata,
}: {
	artifact: TemplateRasterArtifactProducer
	/** 인쇄용 벡터. 없으면 SVG 형식을 내놓지 않는다. */
	vectorArtifact?: (() => Promise<TemplateVectorArtifactResult>) | null
	/** 배경 Graphic처럼 시간축이 있는 소스가 있을 때만 MP4가 실제로 움직인다. */
	videoArtifact?: TemplateVideoArtifactProducer | null
	capability: StudioOutputCapability
	metadata: TemplateExportMetadata | null
}) {
	const [selectedFormat, setSelectedFormat] = useState<StudioOutputFormat | null>(null)
	const [ppi, setPpi] = useState<PrintPpi | undefined>(() => capability.print?.ppi[0])
	const [fps, setFps] = useState<VideoExportSpec['fps'] | undefined>(
		() => capability.video?.mp4.fps[0],
	)
	const [durationSeconds, setDurationSeconds] = useState(() =>
		Math.min(5, capability.video?.mp4.maxDurationSeconds ?? 5),
	)
	const [scale, setScale] = useState(1)
	// 🔴 인쇄물은 되돌릴 수 없다 — 벡터로 못 옮긴 것을 화면이 말할 수 있게 남긴다.
	const [vectorDiagnostics, setVectorDiagnostics] = useState<
		TemplateVectorArtifactResult['diagnostics'] | null
	>(null)
	const effectivePpi = ppi && capability.print?.ppi.includes(ppi) ? ppi : capability.print?.ppi[0]
	const effectiveFps =
		fps && capability.video?.mp4.fps.includes(fps) ? fps : capability.video?.mp4.fps[0]
	const effectiveDuration = Math.min(
		durationSeconds,
		capability.video?.mp4.maxDurationSeconds ?? durationSeconds,
	)
	const formats = capability.formats
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	// TIFF·PDF는 크기를 ppi가 정한다 — 배율을 받아도 쓰지 않으므로 아예 적용하지 않는다.
	const scaleApplies = format === 'png' || format === 'jpeg' || format === 'mp4'
	// MP4만 초당 처리량 예산에 걸린다 — fps를 올리면 같은 캔버스라도 갈 수 있는 배율이 줄어든다.
	const maxScale = metadata
		? Math.min(
				Math.max(1, Math.floor(metadata.maxScale)),
				resolveMaxExportScale(
					metadata.width,
					metadata.height,
					format === 'mp4' ? effectiveFps : undefined,
				),
			)
		: 1
	const scaleOptions = Array.from({ length: maxScale }, (_, index) => index + 1)
	// fps를 올려 지금 배율이 예산을 넘으면 1로 떨어뜨리지 않고 갈 수 있는 최대로 붙인다.
	const selectedScale = Math.min(Math.max(1, Math.floor(scale)), maxScale)
	const effectiveScale = scaleApplies ? selectedScale : 1
	const createRequest = useCallback(
		(candidate: StudioOutputFormat | null): TemplateExportRequest | null => {
			// 🔑 PDF는 벡터가 있으면 벡터로 간다 — 판 전체를 굽는 래스터 PDF보다 글자·도형이 선명하고,
			//    같은 CMYK ICC를 타므로 색이 달라지지 않는다. 벡터가 없는 스튜디오만 래스터로 남는다.
			if (
				candidate &&
				vectorArtifact &&
				metadata &&
				(candidate === 'svg' || candidate === 'pdf')
			) {
				const options = {
					width: metadata.width,
					height: metadata.height,
					// 글자는 굽기 단계가 이미 윤곽선으로 바꾼다 — 여기서 다시 요청하지 않는다.
					outlineText: false,
				}
				return candidate === 'svg'
					? {
							artifact: 'vector',
							format: 'svg',
							colorProfile: {
								space: 'rgb',
								icc: capability.colorProfiles?.rgb?.[0] ?? 'srgb',
							},
							options,
						}
					: {
							artifact: 'vector',
							format: 'pdf',
							colorProfile: {
								space: 'cmyk',
								icc: capability.colorProfiles?.cmyk?.[0] ?? 'cgats21-crpc6',
							},
							options,
						}
			}
			const request =
				candidate && metadata
					? createRasterExportRequest(candidate, capability, {
							width: metadata.width,
							height: metadata.height,
							scale: effectiveScale,
							ppi: effectivePpi,
							fps: effectiveFps,
							durationSeconds: effectiveDuration,
						})
					: null
			// 같은 video spec을 시간축 있는 artifact로 돌린다 — raster MP4는 한 프레임을 반복한다.
			return request?.format === 'mp4' && videoArtifact
				? { artifact: 'video', format: 'mp4', options: request.options }
				: request
		},
		[
			capability,
			effectiveDuration,
			effectiveFps,
			effectivePpi,
			effectiveScale,
			metadata,
			vectorArtifact,
			videoArtifact,
		],
	)
	const execute = useCallback(
		async (request: TemplateExportRequest) => {
			if (!metadata) throw new Error('Template export is unavailable.')
			// Video Artifact는 전경을 목표 프레임 크기로 구워야 하므로 요청 해상도를 넘긴다.
			if (request.artifact === 'vector') {
				if (!vectorArtifact) throw new Error('Template export is unavailable.')
				const { artifact: vector, diagnostics } = await vectorArtifact()
				setVectorDiagnostics(diagnostics)
				return executeArtifactExport({
					artifact: vector,
					fileName: metadata.fileName,
					request,
				})
			}
			if (request.artifact === 'video') {
				if (!videoArtifact) throw new Error('Template export is unavailable.')
				const { width, height } = request.options
				return executeArtifactExport({
					artifact: await videoArtifact({ width, height }),
					fileName: metadata.fileName,
					request,
				})
			}
			return executeArtifactExport({
				artifact: await artifact(),
				fileName: metadata.fileName,
				request,
			})
		},
		[artifact, metadata, vectorArtifact, videoArtifact],
	)
	const output = useExport<TemplateExportRequest>({
		capability,
		canExport: () =>
			Boolean(
				metadata &&
					acceptsControllerExecutionValues(
						metadata.controller.groups,
						metadata.controller.values,
					),
			),
		execute,
	})
	const request = createRequest(format)
	const runFormat = (candidate: StudioOutputFormat): void => {
		const candidateRequest = createRequest(candidate)
		if (candidateRequest) void output.run(candidateRequest)
	}

	return {
		busy: output.exporting !== null,
		error: output.error,
		/** 마지막 벡터 내보내기에서 옮기지 못한 것. 없으면 null이다. */
		vectorDiagnostics,
		vectorWarnings: describeVectorDiagnostics(vectorDiagnostics),
		formats,
		format,
		setFormat: (next: StudioOutputFormat) => {
			if (formats.includes(next)) setSelectedFormat(next)
		},
		ppi: effectivePpi ?? null,
		setPpi: (next: PrintPpi) => {
			if (capability.print?.ppi.includes(next)) setPpi(next)
		},
		fps: effectiveFps ?? null,
		setFps: (next: VideoExportSpec['fps']) => {
			if (capability.video?.mp4.fps.includes(next)) setFps(next)
		},
		durationSeconds: effectiveDuration,
		setDuration: (next: number) => {
			const max = capability.video?.mp4.maxDurationSeconds
			if (max && next > 0 && next <= max) setDurationSeconds(next)
		},
		scale: effectiveScale,
		scaleOptions,
		/** 이번 포맷이 배율을 실제로 쓰는지 — 안 쓰면 사이드바가 Scale 행을 감춘다. */
		scaleApplies,
		setScale: (next: number) => {
			if (scaleOptions.includes(next)) setScale(next)
		},
		/**
		 * 실제로 나올 픽셀 크기. MP4는 짝수 내림까지 거친 요청 값을 그대로 쓴다 —
		 * 캔버스에 배율만 곱해 보여 주면 홀수 변에서 1px 어긋난 값을 안내하게 된다.
		 */
		outputSize: resolveOutputSize(request, metadata, effectiveScale),
		canExport: Boolean(request && output.canExport(request)),
		run: () => {
			if (request) void output.run(request)
		},
		canExportFormat: (candidate: StudioOutputFormat) => {
			const candidateRequest = createRequest(candidate)
			return Boolean(candidateRequest && output.canExport(candidateRequest))
		},
		runFormat,
	}
}

/**
 * 진단을 사람이 읽는 한 줄로 옮긴다. 노드 id를 그대로 보여 주지 않는다 — 화면에서 그 id로
 * 무엇을 찾을 수 없고, 알아야 할 것은 「무엇이 원본과 달라졌나」다.
 */
function describeVectorDiagnostics(
	diagnostics: TemplateVectorArtifactResult['diagnostics'] | null,
): string[] {
	if (!diagnostics) return []
	const warnings: string[] = []

	const effects = new Set(diagnostics.unsupported.map(({ reason }) => reason))
	const effectLabels: Record<string, string> = {
		'backdrop-filter': '배경 흐림',
		'blend-mode': '혼합 모드',
		'box-shadow': '그림자',
		filter: '흐림 효과',
		gradient: '그라디언트',
		mask: '마스크',
	}
	const named = [...effects].map((reason) => effectLabels[reason] ?? reason)
	if (named.length > 0) {
		warnings.push(`벡터로 옮기지 못한 효과가 있습니다: ${named.join(' · ')}`)
	}

	const fonts = new Set(diagnostics.notOutlined.map(({ fontFamily }) => fontFamily))
	if (fonts.size > 0) {
		warnings.push(`글자를 윤곽선으로 바꾸지 못해 서체가 필요합니다: ${[...fonts].join(' · ')}`)
	}
	return warnings
}
