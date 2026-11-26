// A friendly globe mascot drawn with flat shapes so it matches the chunky
// game interface. No external assets, no emoji, and it scales cleanly.
export function Mascot({ size, className = '' }) {
  return (
    <span
      className={`mascot ${className}`.trim()}
      style={size ? { width: size } : undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 240" role="presentation" focusable="false">
        <ellipse cx="120" cy="222" rx="72" ry="11" fill="#2b4a5a" opacity="0.12" />

        {/* waving arm */}
        <path
          d="M50 133c-20-2-31-15-30-30"
          fill="none"
          stroke="#29b6f6"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <circle cx="19" cy="99" r="9" fill="#3cc6f7" stroke="#0f9fd8" strokeWidth="4" />
        <path d="M6 82l-8-6M8 71l-4-9" stroke="#0f9fd8" strokeWidth="5" strokeLinecap="round" />

        {/* flag */}
        <path d="M188 72V22" stroke="#5b7787" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M188 24l37 9-37 12Z"
          fill="#ffc800"
          stroke="#e0aa00"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* globe body */}
        <circle cx="120" cy="120" r="82" fill="#3cc6f7" stroke="#0f9fd8" strokeWidth="7" />

        {/* continents */}
        <path
          d="M54 96c-8-18 5-36 23-41 11-3 23 2 25 12 2 9-5 15-9 22-4 9-6 19-17 22-12 3-19-6-22-15Z"
          fill="#7ed957"
        />
        <path
          d="M104 68c11-6 24-1 28 9 3 8-2 15 2 22 5 9 13 13 10 23-3 11-15 14-25 10-9-4-15-12-16-21-2-16-8-35 1-43Z"
          fill="#7ed957"
        />
        <path
          d="M143 150c13-5 29 2 32 14 3 10-4 20-15 22-11 3-21-3-24-13-2-9 1-20 7-23Z"
          fill="#7ed957"
        />
        <ellipse cx="176" cy="80" rx="11" ry="7" fill="#7ed957" transform="rotate(-18 176 80)" />

        {/* glossy highlight */}
        <path
          d="M64 83c9-18 27-30 48-33"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.34"
        />

        {/* face */}
        <circle cx="95" cy="115" r="18" fill="#ffffff" />
        <circle cx="147" cy="115" r="18" fill="#ffffff" />
        <circle cx="98" cy="118" r="8" fill="#1c5b74" />
        <circle cx="150" cy="118" r="8" fill="#1c5b74" />
        <circle cx="101" cy="114" r="3" fill="#ffffff" />
        <circle cx="153" cy="114" r="3" fill="#ffffff" />
        <ellipse cx="72" cy="141" rx="10" ry="6" fill="#ff8fa3" opacity="0.55" />
        <ellipse cx="170" cy="141" rx="10" ry="6" fill="#ff8fa3" opacity="0.55" />
        <path
          d="M98 143c8 13 38 13 46 0"
          fill="none"
          stroke="#1c5b74"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
