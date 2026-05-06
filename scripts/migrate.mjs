import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const dir = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(dir, '../.env.local') })

const url = process.env.DATABASE_URL
if (!url || url.includes('[YOUR-')) {
  console.error('DATABASE_URL not set or still a placeholder')
  process.exit(1)
}

const client = postgres(url, { max: 1, ssl: 'require' })
const db = drizzle(client)

console.log('Running migrations...')
await migrate(db, { migrationsFolder: './drizzle' })
console.log('✓ Migrations complete')
await client.end()
