import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CmykIccProfile } from './export-contract'

/** 공개 요청의 승인 ID를 서버에 포함된 ICC 파일 경로로 해석한다. */
export function resolveCmykIccProfilePath(profile: CmykIccProfile): string {
	switch (profile) {
		case 'cgats21-crpc6':
			return path.join(process.cwd(), 'public', 'icc', 'CGATS21_CRPC6.icc')
	}
}

/** 승인 ICC asset의 원본 bytes를 PDF OutputIntent adapter에 제공한다. */
export function readCmykIccProfile(profile: CmykIccProfile): Promise<Buffer> {
	return readFile(resolveCmykIccProfilePath(profile))
}
