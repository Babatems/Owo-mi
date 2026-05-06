import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const dir = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(dir, '../.env.local') })

const client = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' })

const accounts = await client`SELECT id, name FROM financial_accounts WHERE slug IS NULL`
console.log(`Found ${accounts.length} accounts without slugs`)

for (const acc of accounts) {
  const base = acc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const slug = base + '-' + acc.id.slice(0, 6)
  await client`UPDATE financial_accounts SET slug = ${slug} WHERE id = ${acc.id}`
  console.log(`  ${acc.name} → ${slug}`)
}

console.log('✓ Done')
await client.end()
