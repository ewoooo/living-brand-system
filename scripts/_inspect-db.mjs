// TEMP read-only DB inspector. Bypasses Payload (no schema push). Delete after use.
const pgPath =
	'/Users/plusx/Documents/GitHub/hd-guideline/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js'
const pg = (await import(pgPath)).default
const { Client } = pg

const c = new Client({
	connectionString: process.env.DBURL,
	ssl: { rejectUnauthorized: false },
})
await c.connect()

async function q(label, sql, args = []) {
	try {
		const r = await c.query(sql, args)
		return r.rows
	} catch (e) {
		console.log(`  [${label}] ERR: ${e.message}`)
		return null
	}
}

// 1) 어떤 DB / 버전
const who = await q('whoami', 'select current_database() db, current_user usr, version() v')
if (who) console.log(`DB=${who[0].db}  user=${who[0].usr}\n${who[0].v}\n`)

// 2) 스키마별 base table 수
const schemas = await q(
	'schemas',
	`select table_schema, count(*)::int n
	 from information_schema.tables
	 where table_type='BASE TABLE'
	 group by table_schema order by table_schema`,
)
console.log('=== base tables per schema ===')
for (const s of schemas ?? []) console.log(`  ${s.table_schema}: ${s.n}`)

// 3) public 테이블 목록
const pub = await q(
	'public',
	"select tablename from pg_tables where schemaname='public' order by 1",
)
console.log(`\n=== public tables (${pub?.length ?? '?'}) ===`)
for (const t of pub ?? []) console.log(`  ${t.tablename}`)

// 4) Supabase auth 사용자 수 (이메일은 PII → 마스킹)
const au = await q('auth.users', 'select count(*)::int n from auth.users')
if (au) {
	console.log(`\n=== auth.users: ${au[0].n} ===`)
	if (au[0].n > 0) {
		const rows = await q(
			'auth.users.list',
			'select email, created_at from auth.users order by created_at limit 20',
		)
		for (const u of rows ?? []) {
			const m = String(u.email || '').replace(/^(.).*@.*$/, '$1***@***')
			console.log(`  ${m}  ${u.created_at?.toISOString?.() ?? u.created_at}`)
		}
	}
}

// 5) storage 업로드 (buckets / objects)
const buckets = await q('storage.buckets', 'select count(*)::int n from storage.buckets')
const objects = await q('storage.objects', 'select count(*)::int n from storage.objects')
console.log(
	`\n=== storage: buckets=${buckets ? buckets[0].n : '?'} objects=${objects ? objects[0].n : '?'} ===`,
)

// 6) 설치된 extensions
const ext = await q('extensions', 'select extname from pg_extension order by extname')
console.log(`\n=== extensions ===`)
console.log('  ' + (ext ?? []).map((e) => e.extname).join(', '))

await c.end()
