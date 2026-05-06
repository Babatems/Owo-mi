import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL ?? ''

// During `next build`, page data collection runs without a real DB.
// We create a no-op client stub so imports don't fail; actual queries
// will throw at runtime if DATABASE_URL is not configured.
function createDb() {
  if (!DATABASE_URL || DATABASE_URL.includes('[YOUR-')) {
    return drizzle('postgresql://localhost/placeholder' as never, { schema }) as ReturnType<
      typeof drizzle<typeof schema>
    >
  }
  const client = postgres(DATABASE_URL, { max: 1, ssl: 'require' })
  return drizzle(client, { schema })
}

export const db = createDb()

export type Database = typeof db
