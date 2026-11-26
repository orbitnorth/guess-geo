import { useEffect, useRef, useState } from 'react'

// Counts from the previously displayed value to the new one with an
// ease-out curve. Purely visual - the real score lives in App state.
export function AnimatedNumber({
  value,
  duration = 850,
  format = (n) => Math.round(n).toLocaleString(),
}) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const frameRef = useRef(0)

  useEffect(() => {
    const from = displayRef.current
    const to = value

    if (from === to) return undefined

    const startedAt = performance.now()

    const step = (now) => {
      const t = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (to - from) * eased
      displayRef.current = next
      setDisplay(next)
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return <>{format(display)}</>
}
