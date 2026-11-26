'use client'

import dynamic from 'next/dynamic'

const GeoGuessGame = dynamic(() => import('@/components/GeoGuessGame'), {
  ssr: false,
  loading: () => (
    <div className="stage-loading">
      <div className="stage-spinner" />
      <p>Loading 3D Globe...</p>
    </div>
  ),
})

export default function HomePage() {
  return <GeoGuessGame />
}
