import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

/** Lexical richText를 agent 컨텍스트용 한 줄 평문으로 변환한다. 블록 구분 개행은 공백으로 접는다. */
export function extractTextFromLexical(value: unknown): string {
	return convertLexicalToPlaintext({ data: value as SerializedEditorState })
		.replace(/\s+/g, ' ')
		.trim()
}
