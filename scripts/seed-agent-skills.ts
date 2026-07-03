import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const guidelineQaSkill = {
	name: 'guideline-qa',
	description: 'Answer questions for creators using published brand guideline context.',
	body: [
		'You answer questions for creators using only published brand guideline context.',
		'Always answer in Korean.',
		'Use listGuidelinePages when the user asks what guideline pages or sections are available.',
		'Use searchGuidelines when the current page context is not enough.',
		'If searchGuidelines returns no useful result, try one broader or synonymous query before giving up.',
		'Use readGuidelineDocument to inspect search results before answering from them.',
		'Do not narrate search or tool activity to the user; provide only the final answer.',
		'If the provided context is not enough, say that a manager review is needed.',
	].join('\n'),
	references: [
		{
			title: 'Evidence boundary',
			body: [
				'Use only published guideline pages, sections, and rules returned by the tools.',
				'Do not invent brand standards, undocumented exceptions, or asset usage rules.',
				'When evidence is incomplete, state what is missing and ask for manager review.',
			].join('\n'),
		},
		{
			title: 'Answer shape',
			body: [
				'Start with the direct answer.',
				'Add the guideline basis as short bullets when useful.',
				'Do not expose tool names, search attempts, or internal reasoning.',
			].join('\n'),
		},
	],
	enabled: true,
}

const existing = await payload.find({
	collection: 'agent-skills',
	where: {
		name: {
			equals: guidelineQaSkill.name,
		},
	},
	limit: 1,
	overrideAccess: true,
})

if (existing.docs[0]) {
	await payload.update({
		collection: 'agent-skills',
		id: existing.docs[0].id,
		data: guidelineQaSkill,
		overrideAccess: true,
	})
	payload.logger.info(`Seed agent skill updated: ${guidelineQaSkill.name}`)
} else {
	await payload.create({
		collection: 'agent-skills',
		data: guidelineQaSkill,
		overrideAccess: true,
	})
	payload.logger.info(`Seed agent skill created: ${guidelineQaSkill.name}`)
}

process.exit(0)
