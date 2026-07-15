# Checker name·내장 프롬프트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Checkers에 비개발자용 표시 이름(`name`)을 추가하고, `promptKey`를 매니저가 작성하는 관찰 지침 삽입란(`prompt`)으로 교체한다.

**Architecture:** Payload 컬렉션 스키마 변경(`rule-checkers`) → 런타임 계약(`RuntimeCheck`) 필드 교체 → AI 호출 메시지에 per-check `checkerPrompt:` 라인 삽입. 출력 계약(관찰만, 판정 금지, Zod 스키마)은 코드 소유를 유지한다. 설계 근거: `docs/superpowers/specs/2026-07-15-checker-title-prompt-design.md`.

**Tech Stack:** Payload CMS 3.85, Drizzle(Postgres) 마이그레이션, Vitest, AI SDK(`generateText`).

## Global Constraints

- 커밋 메시지는 Conventional Commits + 한국어 요약 (`feat: ...`, `test: ...`).
- 이 워크트리는 `feat/checker-title-prompt` 브랜치다. main·stage에 직접 커밋 금지.
- 스키마 변경이므로 마이그레이션(`.ts` + `.json` 스냅샷 + `migrations/index.ts`)과 `src/payload-types.ts`를 소스와 함께 커밋해야 완결이다 (CLAUDE.md 스키마 규칙).
- `.env.local`은 절대 커밋하지 않는다. 이 워크트리에서 dev 서버를 공유 DB로 띄우지 않는다 (`PAYLOAD_DB_PUSH=false` 유지).
- 들여쓰기 탭, `pnpm check`(biome)·`pnpm typecheck` 통과 상태로만 커밋.
- 명명 규칙: 함수는 동사 시작 camelCase (docs/06 §11).

---

### Task 1: RuleCheckers 컬렉션 — `name` 추가, `prompt` 도입, `promptKey` 삭제

**Files:**
- Modify: `src/collections/RuleCheckers.ts`
- Test: `src/collections/RuleCheckers.test.ts`

**Interfaces:**
- Consumes: 없음 (독립 스키마 변경)
- Produces: `rule-checkers` 컬렉션 필드 `name: text(required)`, `prompt: textarea(optional, heuristic 조건부)`. `promptKey` 필드는 사라짐. Task 2·3이 이 스키마에 의존.

참고: 이 태스크는 Payload config만 바꾸므로 커밋 시점에 `pnpm typecheck`가 통과한다
(런타임 코드는 아직 구세대 `payload-types.ts`의 promptKey를 참조하며, 타입 재생성은 Task 2 Step 0에서 수행).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/collections/RuleCheckers.test.ts` 전체를 다음으로 교체:

```ts
import { describe, expect, it } from 'vitest'
import { RuleCheckers } from './RuleCheckers'

type Validate = (
	value: unknown,
	context: { siblingData: { executor: 'deterministic' | 'heuristic' | 'manual' } },
) => unknown

function fieldNamed(name: string) {
	return RuleCheckers.fields.find(
		(candidate) => 'name' in candidate && candidate.name === name,
	)
}

function validationFor(name: string): Validate {
	const field = fieldNamed(name)
	if (
		(field?.type !== 'text' && field?.type !== 'select') ||
		typeof field.validate !== 'function'
	) {
		throw new Error(`${name} validation is not configured`)
	}
	return field.validate as unknown as Validate
}

describe('RuleCheckers executor binding', () => {
	it('저장소 식별자는 유지하고 Admin에는 name을 표시한다', () => {
		expect(RuleCheckers.slug).toBe('rule-checkers')
		expect(RuleCheckers.labels).toEqual({ singular: 'Checker', plural: 'Checkers' })
		expect(RuleCheckers.admin?.useAsTitle).toBe('name')

		const name = fieldNamed('name')
		expect(name?.type === 'text' && name.required).toBe(true)
	})

	it('선택한 executor에 필요한 binding만 필수로 검증한다', () => {
		expect(
			validationFor('checkerKey')('', { siblingData: { executor: 'deterministic' } }),
		).toBe('Checker Key를 입력하세요.')
		expect(validationFor('checkerKey')('', { siblingData: { executor: 'heuristic' } })).toBe(
			true,
		)
		expect(validationFor('model')('', { siblingData: { executor: 'heuristic' } })).toBe(
			'Model을 선택하세요.',
		)
	})

	it('prompt는 heuristic 전용 선택 항목이고 promptKey는 존재하지 않는다', () => {
		const prompt = fieldNamed('prompt')
		expect(prompt?.type).toBe('textarea')
		expect(prompt && 'required' in prompt && prompt.required).toBeFalsy()
		expect(fieldNamed('promptKey')).toBeUndefined()
	})

	it('heuristic model은 Opus, Sonnet, Haiku 중에서 선택한다', () => {
		const model = fieldNamed('model')
		if (model?.type !== 'select') throw new Error('model select is not configured')

		expect(model.options).toEqual([
			{ label: 'Opus', value: 'claude-opus-4-8' },
			{ label: 'Sonnet', value: 'claude-sonnet-5' },
			{ label: 'Haiku', value: 'claude-haiku-4-5' },
		])
	})
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/collections/RuleCheckers.test.ts`
Expected: FAIL — `useAsTitle`이 `'key'`, `name` 필드 없음, `promptKey` 존재.

- [ ] **Step 3: 컬렉션 구현**

`src/collections/RuleCheckers.ts`에서:

(a) `admin` 블록을 다음으로 교체:

```ts
	admin: {
		group: 'Quality',
		useAsTitle: 'name',
		defaultColumns: ['name', 'key', 'executor', '_status', 'updatedAt'],
		description: 'Guideline Check를 실행할 도구와 호출 계약입니다.',
		listSearchableFields: ['name', 'key', 'checkerKey', 'model'],
	},
```

(b) `fields` 배열 맨 앞(`key` 필드 앞)에 `name` 필드 추가:

```ts
		{
			name: 'name',
			type: 'text',
			required: true,
			admin: {
				description: '목록과 Check의 checker 선택에 표시할 이름입니다.',
			},
		},
```

(c) `promptKey` 필드 블록(기존 86-93행)을 다음 `prompt` 필드로 교체:

```ts
		{
			name: 'prompt',
			type: 'textarea',
			admin: {
				condition: (_, siblingData) => siblingData?.executor === 'heuristic',
				description:
					'휴리스틱 검수 시 AI에게 전달할 관찰 지침입니다. 출력 형식과 판정 금지 규칙은 시스템이 강제하므로 자유롭게 작성해도 검수가 깨지지 않습니다.',
			},
		},
```

`requiredFor`·`requiredSelectFor` 헬퍼는 `checkerKey`·`model`이 계속 쓰므로 유지.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/collections/RuleCheckers.test.ts`
Expected: PASS (4 tests)

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/collections/RuleCheckers.ts src/collections/RuleCheckers.test.ts
git commit -m "feat: Checker에 name 표시 이름과 prompt 삽입란 도입"
```

---

### Task 2: RuntimeCheck 계약 교체와 AI 호출 `checkerPrompt:` 삽입

**Files:**
- Create(비커밋): `.env.local` — main 체크아웃에서 복사
- Modify: `src/payload-types.ts` (자동 재생성)
- Modify: `src/features/asset-check/services/get-check-ruleset.service.ts:37,109-160`
- Modify: `src/features/asset-check/repositories/ai-check.agent.repository.ts:12,33-39,formatCheck,지시문`
- Modify: `src/features/asset-check/services/run-check.service.test.ts:24` (픽스처)
- Test: `src/features/asset-check/repositories/ai-check.agent.repository.test.ts`

**Interfaces:**
- Consumes: Task 1의 checker 필드 `prompt`(string | null | undefined, 재생성된 payload-types 경유).
- Produces: `RuntimeCheck.prompt?: string` (`promptKey` 필드 제거), heuristic `implemented`는 `Boolean(model)`. AI 메시지의 check 블록에 `checkerPrompt:` 라인. `AI_CHECK_PROMPT_KEY` export 삭제(외부 사용처 없음). Task 3이 이 스키마 상태에서 마이그레이션을 생성.

- [ ] **Step 0: 워크트리 env 준비(비커밋) 후 타입 재생성**

```bash
cp /Users/plusx/documents/living-brand-system/.env.local .env.local
# push 금지 규칙: 이 워크트리는 스키마 변경 브랜치이므로 공유 DB에 push하면 안 된다.
grep -q '^PAYLOAD_DB_PUSH' .env.local \
  && sed -i '' 's/^PAYLOAD_DB_PUSH=.*/PAYLOAD_DB_PUSH=false/' .env.local \
  || echo 'PAYLOAD_DB_PUSH=false' >> .env.local
pnpm generate:types
```

Expected: `src/payload-types.ts`의 `RuleChecker`에 `name: string`, `prompt?: string | null` 반영, `promptKey` 제거. 이 시점에 `pnpm typecheck`는 실패한다(런타임이 아직 promptKey 참조) — 이 태스크의 Step 3에서 해소되며, 커밋은 태스크 끝에서 한 번만 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

(a) `src/features/asset-check/services/run-check.service.test.ts` 24행과
`src/features/asset-check/repositories/ai-check.agent.repository.test.ts` 25행의
`promptKey: 'asset-check.brand-guideline.v1',` 를 각각 다음으로 교체:

```ts
	prompt: '브랜드 사진의 자연광 기준을 우선 적용한다.',
```

(b) `ai-check.agent.repository.test.ts`의 `describe('runAiCheck', ...)` 안에 추가
(기존 usage 테스트의 `generateText` mock 반환값 패턴 재사용):

```ts
	it('checker prompt를 관찰 컨텍스트로 메시지에 삽입한다', async () => {
		vi.mocked(generateText).mockResolvedValue({
			output: { results: {} },
			usage: undefined,
		} as unknown as Awaited<ReturnType<typeof generateText>>)
		const { runAiCheck } = await import(
			'@/features/asset-check/repositories/ai-check.agent.repository'
		)

		await runAiCheck(checks, {
			image: { data: new Uint8Array([1]), mediaType: 'image/png' },
		} as never)

		const call = vi.mocked(generateText).mock.calls[0]?.[0] as {
			messages: { content: { type: string; text?: string }[] }[]
		}
		const promptText = call.messages[0]?.content[0]?.text ?? ''
		expect(promptText).toContain('checkerPrompt: 브랜드 사진의 자연광 기준을 우선 적용한다.')
		expect(promptText).toContain(
			'Apply heuristicPrompt and checkerPrompt as additional observation context',
		)
	})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/asset-check/repositories/ai-check.agent.repository.test.ts`
Expected: FAIL — 기존 코드는 promptKey 검증(`ai_checker_invalid`)에서 막히고 `checkerPrompt:` 라인이 없음.

- [ ] **Step 3: 구현**

(a) `get-check-ruleset.service.ts`:

- 37행 `promptKey?: string` → `prompt?: string`
- `toRuntimeCheck` 내부(114행 부근): `const promptKey = checker.promptKey ?? undefined` →

```ts
	const prompt = checker.prompt?.trim() || undefined
```

- `implemented` 판정(142행 부근): `Boolean(model && promptKey)` → `Boolean(model)`
- 반환 객체(158행 부근): `promptKey,` → `prompt,`

(b) `ai-check.agent.repository.ts`:

- 12행 `export const AI_CHECK_PROMPT_KEY = 'asset-check.brand-guideline.v1'` 삭제.
- 33-39행 검증 블록을 다음으로 교체 (모델 단일성 검증만 유지):

```ts
	const { model } = checks[0] ?? {}
	if (!model || checks.some((check) => check.model !== model)) {
		return failed('AI 검사 도구 설정 오류', 'ai_checker_invalid')
	}
```

- `formatCheck`에서 `heuristicPrompt` 라인 다음에 삽입:

```ts
		`  checkerPrompt: ${check.prompt || 'Not provided'}`,
```

- 지시문 배열에서
`'Apply heuristicPrompt as additional observation context without changing the output contract.',` 를

```ts
								'Apply heuristicPrompt and checkerPrompt as additional observation context without changing the output contract.',
```

으로 교체.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/asset-check && pnpm typecheck && pnpm check`
Expected: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/payload-types.ts \
  src/features/asset-check/services/get-check-ruleset.service.ts \
  src/features/asset-check/services/run-check.service.test.ts \
  src/features/asset-check/repositories/ai-check.agent.repository.ts \
  src/features/asset-check/repositories/ai-check.agent.repository.test.ts
git status --short   # .env.local이 스테이징에 없는지 확인
git commit -m "feat: 휴리스틱 검수에 checker prompt 관찰 지침 삽입"
```

---

### Task 3: 마이그레이션 생성과 name 백필 — **PR 직전으로 연기됨**

> 2026-07-15 결정: CLAUDE.md Device Handoff Rules에 따라, 이 개인 브랜치는 마이그레이션을
> 생략하고 PR 직전에 스키마 변경 브랜치들을 합친 뒤 한 머신에서 최종 마이그레이션을 한 번만
> 생성한다. 아래 절차는 그 시점에 그대로 사용한다.
>
> **선행 이슈(별도 수정 필요):** 빈 DB에서 기존 마이그레이션 체인이
> `20260714_031500_backfill_guideline_documents`에서 실패한다
> (`relation "guideline_sections_checks_criteria" does not exist`). 원인:
> `migrations/legacy-guideline/{sections,pages}.ts`가 live `guidelineChecksField()`를 공유해
> 이후 추가된 `criteria` 하위 필드 테이블을 legacy 스키마가 요구하지만 생성 SQL이 없음.
> 이 파손은 main에서 유래했고 이 브랜치와 무관하므로 별도 fix 브랜치로 처리한다.

**Files:**
- Create: `migrations/<timestamp>_checker_name_prompt.ts` + `.json` 스냅샷
- Modify: `migrations/index.ts` (자동 갱신)

**Interfaces:**
- Consumes: Task 1의 컬렉션 스키마, Task 2가 준비한 `.env.local`.
- Produces: DB 컬럼 `rule_checkers.name/prompt` 추가, `prompt_key` 삭제. 기존 행 `name`은 `key` 값으로 백필.

- [ ] **Step 1: 마이그레이션 생성**

```bash
pnpm migrate:create checker_name_prompt
```

Expected: `migrations/`에 `<timestamp>_checker_name_prompt.ts`와 같은 이름의 `.json` 스냅샷 생성, `migrations/index.ts` 갱신.

- [ ] **Step 2: 생성된 up()에 name 백필 보강**

생성된 `<timestamp>_checker_name_prompt.ts`의 `up()`을 열어 `rule_checkers`에
`name`이 NOT NULL로 추가된다면 다음 패턴으로 나눈다 (기존 행 보존):

```ts
	await db.execute(sql`
   ALTER TABLE "rule_checkers" ADD COLUMN "name" varchar;
   UPDATE "rule_checkers" SET "name" = "key" WHERE "name" IS NULL;
   ALTER TABLE "rule_checkers" ALTER COLUMN "name" SET NOT NULL;
  `)
```

nullable로 생성됐다면 `UPDATE "rule_checkers" SET "name" = "key" WHERE "name" IS NULL;` 한 줄만
컬럼 추가 뒤에 삽입한다. 버전 테이블(`_rule_checkers_v`)의 `version_name`은 Payload가
nullable로 만들므로 백필 불필요. `prompt` 추가와 `prompt_key` DROP은 생성된 그대로 둔다.

- [ ] **Step 3: 빈 DB에서 마이그레이션 전체 통과 검증**

```bash
createdb lbs_migrate_check_$(whoami) 2>/dev/null || true
DATABASE_URL="postgres://localhost:5432/lbs_migrate_check_$(whoami)" PAYLOAD_DB_PUSH=false pnpm payload migrate
dropdb lbs_migrate_check_$(whoami)
```

Expected: baseline부터 새 마이그레이션까지 전부 성공. 로컬 Postgres가 없으면 이 단계는 CI `migrate` 잡 검증으로 대체하고 그 사실을 보고서에 기록.

- [ ] **Step 4: 커밋**

```bash
pnpm check && pnpm typecheck
git add migrations/
git status --short   # .env.local이 스테이징에 없는지 확인
git commit -m "chore: checker name·prompt 마이그레이션 추가"
```

---

### Task 4: 마무리 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 스위트 최종 실행**

```bash
pnpm check && pnpm typecheck && pnpm test:int
```

Expected: 모두 통과 (환경 요인 제외).

- [ ] **Step 2: promptKey 잔재 없음 확인**

```bash
grep -rn "promptKey\|AI_CHECK_PROMPT_KEY" src --include="*.ts" | grep -v payload-types
```

Expected: 출력 없음.

- [ ] **Step 3: 잔여 변경 커밋 여부 확인**

```bash
git status --short
```

Expected: `.env.local`(비추적)만 남음. 다른 잔여물이 있으면 원인 파악 후 해당 Task 커밋에 포함.
