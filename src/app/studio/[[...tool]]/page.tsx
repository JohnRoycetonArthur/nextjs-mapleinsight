import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const StudioClient = nextDynamic(() => import('./StudioClient'), { ssr: false })

export default function StudioPage() {
  return <StudioClient />
}
