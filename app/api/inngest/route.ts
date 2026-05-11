import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { syncFunctions } from '@/inngest/functions/sync'

export const { GET, POST, PUT } = serve({ client: inngest, functions: syncFunctions })
