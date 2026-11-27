import { InviteChallengeScreen } from '@/components/InviteChallengeScreen'

export default async function InviteDynamicPage({ params }) {
  // In Next.js 15/16 App Router, params is an async Promise on server components
  const resolvedParams = await params
  const rawUuid = resolvedParams?.uuid || ''
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : String(rawUuid)).trim()

  return <InviteChallengeScreen uuid={uuid} />
}
