import { redirect } from 'next/navigation'

export default async function InviteDynamicPage({ params }) {
  const resolvedParams = await params
  const rawUuid = resolvedParams?.uuid || ''
  const uuid = (Array.isArray(rawUuid) ? rawUuid[0] : String(rawUuid)).trim()

  if (uuid) {
    redirect(`/?duel=${encodeURIComponent(uuid)}`)
  } else {
    redirect('/')
  }
}
