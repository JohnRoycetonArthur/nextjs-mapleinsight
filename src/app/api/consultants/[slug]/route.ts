import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'

// Public fields only — primaryEmail is intentionally excluded
const PUBLIC_FIELDS = `
  "slug": slug.current,
  displayName,
  companyName,
  replyToEmail,
  status,
  logo,
  theme,
  emailPolicy
`

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params

  const consultant = await client.fetch(
    `*[_type == "consultant" && slug.current == $slug && status == "active"][0] {
      ${PUBLIC_FIELDS}
    }`,
    { slug },
  )

  if (!consultant) {
    return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
  }

  return NextResponse.json(consultant)
}
