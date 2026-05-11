import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'owo-mi',
  isDev: process.env.INNGEST_DEV === '1',
})
