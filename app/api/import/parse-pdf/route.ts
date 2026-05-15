export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(req: Request): Promise<Response> {
  // Auth check
  const { auth } = await import('@/lib/auth/server')
  const { headers } = await import('next/headers')
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse multipart form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file field' }, { status: 400 })
  }

  // Size check before reading buffer
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'File exceeds 20 MB limit' }, { status: 413 })
  }

  // Read buffer and validate %PDF- magic bytes
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length < 5 || buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return Response.json({ error: 'File is not a valid PDF' }, { status: 422 })
  }

  // Parse — never log raw PDF content
  try {
    const { parsePDF } = await import('@/lib/import/parse-pdf')
    const result = await parsePDF(buf)
    return Response.json(result, { status: 200 })
  } catch (err) {
    console.error('[parse-pdf]', err instanceof Error ? err.name : 'unknown')
    return Response.json({ error: 'Failed to parse PDF' }, { status: 422 })
  }
}
