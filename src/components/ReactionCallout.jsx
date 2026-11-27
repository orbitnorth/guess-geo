'use client'

import { useState, useEffect } from 'react'

export function ReactionCallout({ reaction, tier = 'okay' }) {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (reaction?.text) {
      setAnimKey((prev) => prev + 1)
    }
  }, [reaction?.text])

  if (!reaction?.text) return null

  return (
    <div
      key={animKey}
      className={`reaction-text-overlay tier-${tier}`}
      aria-live="polite"
      role="status"
    >
      <h2 className="reaction-text-pure">
        &ldquo;{reaction.text}&rdquo;
      </h2>
    </div>
  )
}
