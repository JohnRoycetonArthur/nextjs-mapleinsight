import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import type { ContributorPublic } from '@/lib/types/contributor'

export const revalidate = 3600

const CONTRIBUTORS_QUERY = `
  *[_type == "contributor" && status == "active"] | order(displayOrder asc, name asc) {
    name,
    "slug": slug.current,
    "photoUrl": photo.asset->url,
    title,
    company,
    shortBio,
    credentials,
    "categoryNames": categories[]->title,
    location,
    activeSince,
    linkedin
  }
`

export async function GET() {
  const contributors: ContributorPublic[] = await client.fetch(CONTRIBUTORS_QUERY)
  return NextResponse.json(contributors ?? [])
}
